'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginHeader } from '@/app/components/login/Header';
import { User, Stethoscope } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const handleUserTypeSelection = (type: 'patient' | 'medecin') => {
    router.push(`/register/${type}`);
  };

  return (
    <>
      <LoginHeader />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Choisissez votre profil
            </h2>
            <p className="mt-2 text-gray-600">
              Pour créer votre compte, sélectionnez votre type de profil
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <button
              onClick={() => handleUserTypeSelection('patient')}
              className="w-full flex items-center justify-center gap-4 px-4 py-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <User className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900">Je suis un patient</h3>
                <p className="text-gray-500">Créez votre compte pour prendre rendez-vous</p>
              </div>
            </button>

            <button
              onClick={() => handleUserTypeSelection('medecin')}
              className="w-full flex items-center justify-center gap-4 px-4 py-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <Stethoscope className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900">Je suis un médecin</h3>
                <p className="text-gray-500">Créez votre compte pour gérer vos consultations</p>
              </div>
            </button>
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Déjà inscrit ?{' '}
              <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Connectez-vous
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
