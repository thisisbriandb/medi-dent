import axios from 'axios';
import { LoginCredentials } from '@/types/auth.types';
import { ApiResponse } from '@/types/api.types';

const API_URL = 'http://localhost:8000/api'; // Remplacez par l'URL de votre API Laravel

export const login = async (credentials: LoginCredentials): Promise<ApiResponse> => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || 'Une erreur est survenue.' };
  }
}; 