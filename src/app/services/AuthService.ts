import { api } from './api';

export interface LoginCredentials {
  email: string;
  mot_de_passe: string;
}

export interface RegisterPatientData extends LoginCredentials {
  nom: string;
  prenom: string;
  date_naissance: string;
  telephone: string;
  adresse: string;
}

export interface RegisterMedecinData extends LoginCredentials {
  nom: string;
  prenom: string;
  specialite: string;
  ville: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  role: 'medecin' | 'patient';
  created_at: string;
  updated_at: string;
  specialite?: string;
  ville?: string;
  photo_profil?: string;
  description?: string;
  visio?: boolean;
}

const AuthService = {
  setUser(user: User) {
    // Stockage de l'objet utilisateur dans localStorage
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Erreur lors de la désérialisation de l'utilisateur:", error);
      // Supprimer les données corrompues pour éviter les erreurs futures
      localStorage.removeItem('user');
      return null;
    }
  },

  removeUser() {
    localStorage.removeItem('user');
  },

  setToken(token: string) {
    // Stockage dans localStorage
    localStorage.setItem('auth_token', token);
    
    // Stockage dans les cookies
    document.cookie = `auth_token=${token}; path=/; max-age=2592000`; // 30 jours
    
    // Configuration du header Authorization
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  removeToken() {
    // Suppression du localStorage
    localStorage.removeItem('auth_token');
    
    // Suppression du cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    // Suppression du header
    delete api.defaults.headers.common['Authorization'];
  },

  getToken() {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!token && !!user;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      // Endpoint pour récupérer l'utilisateur authentifié
      const response = await api.get('/user');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      // En cas d'erreur (token invalide, etc.), on nettoie tout
      this.removeToken();
      this.removeUser();
      return null;
    }
  },

  async getMedecinProfile(userId: number): Promise<User | null> {
    try {
      const response = await api.get(`/medecins/${userId}`);
      // La réponse de l'API est { success: true, data: { ... } }
      // On retourne donc la propriété `data` qui contient le profil.
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du profil du médecin (user_id: ${userId}):`, error);
      throw error;
    }
  },

  async loginPatient(credentials: LoginCredentials) {
    const response = await api.post('/auth/login/patient', credentials);
    if (response.data.token) {
      this.setToken(response.data.token);
      const user = await this.getCurrentUser();
      if (user) {
        this.setUser(user);
        return { token: response.data.token, user };
      }
    }
    throw new Error("La connexion a échoué : utilisateur non trouvé après l'obtention du token.");
  },

  async loginMedecin(credentials: LoginCredentials) {
    const response = await api.post('/auth/login/medecin', credentials);
    if (response.data.token) {
      this.setToken(response.data.token);
      const user = await this.getCurrentUser();
      if (user) {
        this.setUser(user);
        return { token: response.data.token, user };
      }
    }
    throw new Error("La connexion a échoué : utilisateur non trouvé après l'obtention du token.");
  },

  async registerPatient(data: RegisterPatientData) {
    const response = await api.post('/auth/register/patient', data);
    if (response.data.token) {
      this.setToken(response.data.token);
      const user = await this.getCurrentUser();
      if (user) {
        this.setUser(user);
        return { token: response.data.token, user };
      }
    }
    throw new Error("L'inscription a échoué : utilisateur non trouvé après l'obtention du token.");
  },

  async registerMedecin(data: RegisterMedecinData) {
    const response = await api.post('/auth/register/medecin', data);
    if (response.data.token) {
      this.setToken(response.data.token);
      const user = await this.getCurrentUser();
      if (user) {
        this.setUser(user);
        return { token: response.data.token, user };
      }
    }
    throw new Error("L'inscription a échoué : utilisateur non trouvé après l'obtention du token.");
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      this.removeToken();
      this.removeUser(); // Nettoyage complet
    }
  },

  async updateUserProfile(data: { [key: string]: any }) {
    const formData = new FormData();

    // Ajoute le _method spoofing pour que Laravel traite la requête POST comme un PUT/PATCH
    formData.append('_method', 'PUT'); 

    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value === null || value === undefined) {
        return; // Ne pas ajouter les champs vides
      }
      
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0');
      } else if (typeof value !== 'object') {
        formData.append(key, value);
      }
    });

    try {
      // L'endpoint est /user/profile, la requête est POST mais traitée comme PATCH/PUT grâce à _method
      const response = await api.post(`/medecins/${data.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }
};

export default AuthService; 