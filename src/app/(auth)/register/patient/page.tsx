'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, SyntheticEvent } from "react";
import Image from "next/image";
import { ArrowLeft, User, Mail, Lock, Phone } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function PatientRegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: "",
    telephone: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    try {
      await register({
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        password: formData.password,
        telephone: formData.telephone,
        role: 'praticien',
      });
      router.push('/login');
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
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
                Inscription Patient
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                  <InputWithIcon icon={User} id="prenom" placeholder="Jean" required value={formData.prenom} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <InputWithIcon icon={User} id="nom" placeholder="Dupont" required value={formData.nom} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <InputWithIcon icon={Phone} id="telephone" placeholder="06 12 34 56 78" required value={formData.telephone} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
                <InputWithIcon icon={Mail} id="email" type="email" placeholder="jean.dupont@example.com" required value={formData.email} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
                <InputWithIcon icon={Lock} id="password" type="password" required value={formData.password} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <InputWithIcon icon={Lock} id="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} />
            </div>

              {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">{error}</div>}

              <div className="pt-4">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading ? 'Création en cours...' : 'Créer mon compte'}
            </Button>
              </div>

              <div className="text-center text-gray-600">
                Déjà un compte ?{" "}
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

// Composant utilitaire pour les inputs avec icône
const InputWithIcon = ({ icon: Icon, ...props }: { icon: React.ElementType; [key: string]: any; }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <Input {...props} className="pl-10 bg-gray-50 border-gray-300 focus:ring-blue-500 focus:border-blue-500"/>
    </div>
);