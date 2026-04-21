'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, SyntheticEvent } from "react";
import Image from "next/image";
import { ArrowLeft, Stethoscope, Mail, Lock, User } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function MedecinRegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: "",
    specialite: "",
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      await register({
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        password: formData.password,
        specialite: formData.specialite,
        role: 'praticien',
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
    }
  };

  return (
    <>
      <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
        {/* Formulaire */}
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <Link 
                href="/register" 
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-8"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la sélection
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
                Inscription Médecin
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-6 bg-white">
                {/* Nom et Prénom */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Label htmlFor="prenom" className="text-gray-700">
                      Prénom
                    </Label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="prenom"
                        placeholder="Marie"
                        required
                        value={formData.prenom}
                        onChange={handleChange}
                        className="pl-10 bg-gray-50 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <Label htmlFor="nom" className="text-gray-700">
                      Nom
                    </Label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="nom"
                        placeholder="Curie"
                        required
                        value={formData.nom}
                        onChange={handleChange}
                        className="pl-10 bg-gray-50 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Spécialité */}
                <div className="relative">
                  <Label htmlFor="specialite" className="text-gray-700">
                    Spécialité
                  </Label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Stethoscope className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="specialite"
                      placeholder="Cardiologie"
                      required
                      value={formData.specialite}
                      onChange={handleChange}
                      className="pl-10 bg-gray-50 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="relative">
                  <Label htmlFor="email" className="text-gray-700">
                    Email
                  </Label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="marie.curie@example.com"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 bg-gray-50 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div className="relative">
                  <Label htmlFor="password" className="text-gray-700">
                    Mot de passe
                  </Label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 bg-gray-50 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Confirmer mot de passe */}
                <div className="relative">
                  <Label htmlFor="confirmPassword" className="text-gray-700">
                    Confirmer le mot de passe
                  </Label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10 bg-gray-50 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Créer mon compte
                </Button>
              </div>

              <div className="text-center text-gray-600">
                Déjà inscrit?{" "}
                <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                  Se connecter
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Image de fond */}
        <div className="hidden lg:block relative bg-gradient-to-br from-blue-500 to-blue-700 overflow-hidden">
          <div className="absolute inset-0 bg-black/20 z-10"></div>
          <div className="absolute inset-0">
            <Image
                src="/photo1.jpg"
                alt="Image de médecin"
                fill
                priority
                className="object-cover"
                sizes="50vw"
              />
          </div>
          <div className="absolute inset-0 z-20 flex items-center justify-center p-12">
            <div className="max-w-xl text-center text-white">
              <h2 className="text-4xl font-bold mb-6">
                Bienvenue sur AllôDocta
              </h2>
              <p className="text-xl opacity-90">
                Rejoignez notre communauté de professionnels de santé et offrez à vos patients une expérience de consultation moderne et efficace.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
