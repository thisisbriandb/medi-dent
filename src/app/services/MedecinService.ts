
import { api } from "./api";
import { Medecin } from "@/types/medecin.types";
import { Creneau } from "@/types/creneaux.types";

export const MedecinService = {
  searchMedecins: async (search: string): Promise<Medecin[]> => {
    const response = await api.get(`/medecins/search?search=${search}`);
    return response.data;
  },

  getMedecinCreneaux: async (id: number): Promise<Creneau[]> => {
    const response = await api.get(`/medecins/${id}/creneaux`);
    return response.data;
  },

  getAllMedecins: async (date?: Date): Promise<any> => {
    const params = date ? { date: new Date(date).toISOString().split('T')[0] } : {};
    return await api.get('/medecins', { params });
  },
};
