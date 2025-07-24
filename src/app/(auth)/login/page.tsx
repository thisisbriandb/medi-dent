'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LoginHeader } from '@/app/components/login/Header';
import { Mail, Lock, ArrowRight, User, Stethoscope } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { type LoginCredentials } from '@/app/services/AuthService';

export default function LoginPage() {
  const { loginPatient, loginMedecin } = useAuth();
  const [userType, setUserType] = useState<'patient' | 'medecin'>('patient');
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    mot_de_passe: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (userType === 'patient') {
        await loginPatient(formData);
      } else {
        await loginMedecin(formData);
      }
      // La redirection est maintenant gérée par AuthContext.
      // Il n'y a plus rien à faire ici après une connexion réussie.
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      <LoginHeader />
      <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
        {/* Formulaire de connexion */}
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
                Connectez-vous
              </h1>
            </div>

            {/* Sélection du type d'utilisateur */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                type="button"
                onClick={() => setUserType('patient')}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all ${
                  userType === 'patient'
                    ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                    : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <User className="w-5 h-5" />
                Patient
              </button>
              <button
                type="button"
                onClick={() => setUserType('medecin')}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all ${
                  userType === 'medecin'
                    ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                    : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Stethoscope className="w-5 h-5" />
                Médecin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm flex items-center justify-center">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="vous@exemple.com"
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div>
                  <label htmlFor="mot_de_passe" className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="mot_de_passe"
                      name="mot_de_passe"
                      type="password"
                      required
                      value={formData.mot_de_passe}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Se souvenir de moi
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connexion en cours...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Se connecter
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </span>
                  )}
                </button>
              </div>

              <div className="text-center">
                <span className="text-gray-600">
                  Pas encore de compte ?{' '}
                  <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                    S'inscrire
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* Image de fond */}
        <div className="hidden lg:block relative bg-gradient-to-br from-blue-500 to-blue-700 overflow-hidden">
          <div className="absolute inset-0 bg-black/20 z-10"></div>
          <div className="absolute inset-0">
            <Image
              src="/doctor-consultation.jpg"
              alt="Consultation médicale"
              fill
              priority
              className="object-cover"
              sizes="50vw"
            />
          </div>
          <div className="absolute inset-0 z-20 flex items-center justify-center p-12">
            <div className="max-w-xl text-center text-white">
              <h2 className="text-4xl font-bold mb-6">
                Votre santé, notre priorité
              </h2>
              <p className="text-xl opacity-90">
                Accédez à vos consultations et gérez vos rendez-vous en toute simplicité.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
