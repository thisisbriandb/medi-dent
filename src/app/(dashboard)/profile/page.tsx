"use client"

import React, { useState, useEffect, useRef } from 'react';
import AuthService, { User } from '@/app/services/AuthService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Upload, MapPin } from 'lucide-react';

const API_STORAGE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '/storage/') || 'http://localhost:8000/storage/';

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const baseUser = await AuthService.getCurrentUser();

      if (baseUser && baseUser.role === 'medecin') {
        const medecinProfile = await AuthService.getMedecinProfile(baseUser.id);
        const fullProfile = { ...baseUser, ...medecinProfile };
        setUser(fullProfile);
        setFormData(fullProfile);
      } else {
        setUser(baseUser);
        setFormData(baseUser || {});
      }

    } catch (err) {
      setError("Impossible de charger les informations de l'utilisateur.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, visio: checked }));
  };
  
  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePhotoFile(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const resetFormState = () => {
    setFormData(user || {});
    setProfilePhotoFile(null);
    setProfilePhotoPreview(null);
    setError(null);
    setSuccess(null);
  }

  const handleEditToggle = () => {
    if (isEditing) {
      resetFormState();
    }
    setIsEditing(!isEditing);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const dataToUpdate: { [key: string]: any } = { ...formData };
    if (profilePhotoFile) {
      dataToUpdate.photo_profil = profilePhotoFile;
    }

    try {
      await AuthService.updateUserProfile(dataToUpdate);
      setSuccess("Profil mis à jour avec succès !");
      setIsEditing(false);
      await fetchUser();
    } catch (err: any) {
      setError(err.response?.data?.message || "Une erreur est survenue lors de la mise à jour.");
    } finally {
      setIsSaving(false);
      setProfilePhotoFile(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div></div>;
  }
  if (!user) {
    return <div className="container mx-auto px-4 py-8"><p>Aucun utilisateur trouvé.</p></div>;
  }
  
  const getInitials = (name?: string) => {
    if (!name || typeof name !== 'string') {
      return '...'; // Fallback pour éviter le crash
    }
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // On crée un nom d'affichage robuste qui gère l'absence de `user.name`
  const displayName = user.name || `${(user as any).prenom || ''} ${(user as any).nom || ''}`.trim();

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mon Profil</h1>
          <div className="flex gap-2">
            {isEditing && <Button type="button" variant="outline" onClick={handleEditToggle} disabled={isSaving}>Annuler</Button>}
            <Button type="button" onClick={isEditing ? handleSubmit : handleEditToggle} disabled={isSaving}>
              {isSaving ? "Sauvegarde..." : (isEditing ? 'Sauvegarder' : 'Modifier le profil')}
            </Button>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {success && <Alert variant="default" className="bg-green-50 border-green-200 text-green-700"><CheckCircle className="h-4 w-4" /><AlertTitle>Succès</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}
          {error && <Alert variant="destructive"><XCircle className="h-4 w-4" /><AlertTitle>Erreur</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Card className="text-center">
              <CardHeader>
                <div className="relative w-32 h-32 mx-auto">
                  <Avatar className="w-full h-full text-4xl">
                    <AvatarImage src={profilePhotoPreview || (user.photo_profil ? `${API_STORAGE_URL}${user.photo_profil}` : "/default-avatar.png")} alt={displayName} />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <button type="button" onClick={() => profilePhotoInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-transform hover:scale-110">
                      <Upload className="w-5 h-5" />
                      <input type="file" ref={profilePhotoInputRef} onChange={handleProfilePhotoChange} accept="image/*" className="hidden" />
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-2xl">{displayName}</CardTitle>
                <CardDescription className="text-md capitalize">{user.role}</CardDescription>
              </CardContent>
            </Card>

            {user.role === 'medecin' && (
              <Card>
                <CardHeader>
                  <CardTitle>Disponibilité</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="visio" className="text-base font-medium">Téléconsultation</Label>
                      <CardDescription className="text-xs">
                        {isEditing ? (formData.visio ? "Actif" : "Inactif") : (user.visio ? "Actif" : "Inactif")}
                      </CardDescription>
                    </div>
                    {isEditing ? <Switch id="visio" checked={formData.visio || false} onCheckedChange={handleSwitchChange} /> : <div className={`w-3 h-3 rounded-full ${user.visio ? 'bg-green-500' : 'bg-gray-400'}`}></div>}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>Gérez vos informations personnelles et de contact.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="flex flex-col">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-500">Adresse e-mail</Label>
                    <p className="text-lg">{user.email}</p>
                 </div>
                 {user.role === 'medecin' && (
                    <>
            
                      <div className="flex flex-col">
                          <Label htmlFor="description" className="text-sm font-medium text-gray-500 mb-1">À propos de moi</Label>
                          {isEditing ? (
                          <Textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} placeholder="Décrivez votre parcours..." rows={4} />
                          ) : (
                          <p className="text-lg whitespace-pre-wrap text-gray-700">{user.description || 'Aucune description fournie.'}</p>
                          )}
                      </div>
                    </>
                 )}
              </CardContent>
            </Card>
            
            {user.role === 'medecin' && user.ville && (
              <Card>
                 <CardHeader>
                    <CardTitle>Localisation</CardTitle>
                    <CardDescription>Retrouvez votre cabinet sur la carte.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <div className="aspect-video w-full rounded-lg overflow-hidden border">
                       <iframe
                         width="100%"
                         height="100%"
                         style={{ border: 0 }}
                         loading="lazy"
                         allowFullScreen
                         src={`https://maps.google.com/maps?q=${encodeURIComponent(user.ville)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                       ></iframe>
                    </div>
                 </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;