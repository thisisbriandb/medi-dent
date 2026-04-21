"use client"

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ProfilePage = () => {
  const { profil, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!profil) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Aucun utilisateur trouvé.</p>
      </div>
    );
  }

  const displayName = `${profil.prenom} ${profil.nom}`;
  const initials = `${profil.prenom?.[0] || ''}${profil.nom?.[0] || ''}`.toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Mon Profil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="text-center">
            <CardHeader>
              <div className="relative w-32 h-32 mx-auto">
                <Avatar className="w-full h-full text-4xl">
                  <AvatarImage src={profil.photo_url || '/default-avatar.png'} alt={displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{displayName}</CardTitle>
              <CardDescription className="text-md capitalize">{profil.role?.replace('_', ' ')}</CardDescription>
              {profil.specialite && (
                <p className="text-sm text-gray-500 mt-1">{profil.specialite}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Vos informations personnelles et de contact.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg">{profil.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Téléphone</p>
                  <p className="text-lg">{profil.telephone || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Rôle</p>
                  <p className="text-lg capitalize">{profil.role?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Établissement</p>
                  <p className="text-lg">{profil.etablissement?.nom || 'Non configuré'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;