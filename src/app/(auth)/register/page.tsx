'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, KeyRound } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">MediDent Pro</h1>
          <p className="mt-2 text-gray-500">Créez votre espace professionnel</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/register/etablissement')}
            className="w-full flex items-center gap-4 px-5 py-5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
              <Building2 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Créer mon cabinet</h3>
              <p className="text-sm text-gray-500 mt-0.5">Je suis praticien et je veux ouvrir mon espace</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/register/rejoindre')}
            className="w-full flex items-center gap-4 px-5 py-5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
              <KeyRound className="w-6 h-6 text-gray-500 group-hover:text-blue-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">J&apos;ai un code d&apos;invitation</h3>
              <p className="text-sm text-gray-500 mt-0.5">Mon cabinet m&apos;a transmis un code pour rejoindre l&apos;équipe</p>
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          Déjà inscrit ?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
