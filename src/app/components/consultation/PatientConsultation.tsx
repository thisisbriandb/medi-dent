"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Medecin } from '@/types/medecin.types';
import { Appointment, CreneauResponse, Creneau } from '@/types/appointment.types';
import { MedecinService } from '@/app/services/MedecinService';
import { AppointmentService } from '@/app/services/AppointmentService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { BookingDialog } from '@/components/ui/booking-dialog';

// AJOUTEZ CETTE LIGNE
const API_STORAGE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '/storage/') || 'http://localhost:8000/storage/';

const PatientConsultation: React.FC = () => {
    const [medecins, setMedecins] = useState<Medecin[]>([]);
      const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [statusFilter, setStatusFilter] = useState<'pending' | 'history'>('pending');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMedecin, setSelectedMedecin] = useState<Medecin | null>(null);
    const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
    const [creneauxDisponibles, setCreneauxDisponibles] = useState<string[]>([]);
    const { user } = useAuth();

    // Effet pour charger les créneaux disponibles quand un médecin est sélectionné et une date choisie
    useEffect(() => {
        const fetchCreneaux = async () => {
          setCreneauxDisponibles([]);
            setSelectedTime(null);
            if (!selectedMedecin?.id_medecin || !selectedDate) return;
            
            try {
                const startOfDay = new Date(selectedDate);
                const endOfDay = new Date(selectedDate);
                endOfDay.setHours(23, 59, 59);
                
                const response: CreneauResponse = await AppointmentService.getAppointmentsByDoctor(
                    selectedMedecin.id_medecin.toString(),
                    startOfDay,
                    endOfDay
                );
                
                // Vérifier si nous avons des données dans la réponse
                if (response.success && Array.isArray(response.data)) {
                    // Filtrer les créneaux pour la date sélectionnée
                    const creneauxDuJour = response.data.filter((creneau: Creneau) => 
                        creneau.date_creneau === format(selectedDate, 'yyyy-MM-dd')
                    );

                    if (creneauxDuJour.length > 0) {
                        // Pour chaque créneau, générer des slots de 30 minutes
                        const slots: string[] = [];
                        creneauxDuJour.forEach((creneau: Creneau) => {
                            const debut = creneau.heure_debut.slice(0, 5); // "09:00"
                            const fin = creneau.heure_fin.slice(0, 5); // "18:00"
                            
                            // Convertir en minutes pour faciliter le calcul
                            const [debutH, debutM] = debut.split(':').map(Number);
                            const [finH, finM] = fin.split(':').map(Number);
                            let tempsActuel = debutH * 60 + debutM;
                            const tempsFin = finH * 60 + finM;
                            
                            // Générer des créneaux de 30 minutes
                            while (tempsActuel < tempsFin) {
                                const heures = Math.floor(tempsActuel / 60);
                                const minutes = tempsActuel % 60;
                                slots.push(
                                    `${String(heures).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                                );
                                tempsActuel += 30; // Incrémenter de 30 minutes
                            }
                        });
                        
                        setCreneauxDisponibles(slots);
                    } else {
                        setCreneauxDisponibles([]);
                    }
                } else {
                    setCreneauxDisponibles([]);
                }
            } catch (err) {
                console.error("Erreur lors de la récupération des créneaux:", err);
                setCreneauxDisponibles([]);
            }
        };

        fetchCreneaux();
    }, [selectedMedecin, selectedDate]);

    useEffect(() => {
        const fetchMedecins = async () => {
            try {
                setLoading(true);
                const medecinsResponse = await MedecinService.getAllMedecins(selectedDate);
                setMedecins(medecinsResponse.data.data); // Accéder à .data.data
                setError(null);
            } catch (err) {
                setError('Erreur lors de la récupération des médecins.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMedecins();
    }, [selectedDate]);

    useEffect(() => {
        const fetchAppointments = async () => {
            if (!user?.id) return;
            try {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setFullYear(endDate.getFullYear() + 1);
                const response = await AppointmentService.getAppointmentsByPatient(user.id.toString(), startDate, endDate);
                
                if (response && response.success && Array.isArray(response.data)) {
                    setAppointments(response.data);
                } else {
                    console.error("Invalid appointments data format:", response);
                    setAppointments([]);
                }
            } catch (err) {
                console.error("Erreur lors de la récupération des rendez-vous.", err);
                setAppointments([]); // Set empty array on error
            }
        };

        fetchAppointments();
    }, [user]);

    const filteredMedecins = useMemo(() => {
        return medecins.filter(medecin => {
            const term = searchTerm.toLowerCase();
            return (
                medecin.ville?.toLowerCase().includes(term) ||
                medecin.specialite?.toLowerCase().includes(term)
            );
        });
    }, [medecins, searchTerm]);

    const filteredAppointments = useMemo(() => {
        const now = new Date();
        if (statusFilter === 'pending') {
            return appointments.filter(app => new Date(app.date) >= now);
        } else { // history
            return appointments.filter(app => new Date(app.date) < now);
        }
    }, [appointments, statusFilter]);

    const handleOpenBooking = () => {
        // On ne peut ouvrir le dialogue que si toutes les infos sont là
        if (selectedMedecin && selectedDate && selectedTime) {
            setIsBookingDialogOpen(true);
        }
    };

    const handleAppointmentBooked = () => {
        // Re-fetch appointments to show the new one
        if (user?.id) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
            AppointmentService.getAppointmentsByPatient(user.id.toString(), startDate, endDate)
                .then((response) => {
                    if (response && response.success && Array.isArray(response.data)) {
                        setAppointments(response.data);
                    } else {
                        console.error("Invalid response format:", response);
                        setAppointments([]);
                    }
                })
                .catch(error => {
                    console.error("Error fetching appointments:", error);
                    setAppointments([]);
                });
        }
    };

    const MedecinCard = ({ medecin }: { medecin: Medecin }) => (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center space-x-4">
                    <Avatar>
                        <AvatarImage src={medecin.photo_profil ? `${API_STORAGE_URL}${medecin.photo_profil}` : '/default-avatar.png'} alt={`${medecin.nom} ${medecin.prenom}`} />
                        <AvatarFallback>{medecin.nom.charAt(0)}{medecin.prenom.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle>{`Dr. ${medecin.nom} ${medecin.prenom}`}</CardTitle>
                        <p className="text-sm text-muted-foreground">{medecin.specialite}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm">{medecin.ville}</p>
                <Button className="mt-4 w-full" onClick={() => setSelectedMedecin(medecin)}>Voir disponibilités</Button>
            </CardContent>
        </Card>
    );

    const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
        const medecin = medecins.find(m => m.id_medecin.toString() === appointment.doctorId);

        return (
            <Card className="w-full">
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <CardTitle>RDV avec Dr. {medecin ? `${medecin.nom} ${medecin.prenom}` : 'Inconnu'}</CardTitle>
                         <span className={`px-2 py-1 text-xs rounded-full ${new Date(appointment.date) >= new Date() ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-800'}`}>
                             {appointment.status}
                         </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <p><strong>Date:</strong> {format(new Date(appointment.date), 'PPP p')}</p>
                    <p><strong>Titre:</strong> {appointment.title}</p>
                    <p><strong>Description:</strong> {appointment.description || 'Non spécifié'}</p>
                </CardContent>
            </Card>
        );
    }


    if (loading) return <p>Chargement...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

return (
    // MODIFIÉ : Le layout a été légèrement revu pour une meilleure structure (main + aside)
    <div className="min-h-screen bg-[#f6fafd] p-4 lg:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2 space-y-8">
            {/* Specialties pills */}
            <div className="flex flex-wrap gap-3 mb-2">
              {['Pediatre', 'Traumatologue', 'Cardiologue', 'Endocrinologue', 'Ophtalmologue', 'Psychologue', 'Pulmonologue', 'Oncologue'].map(cat => (
                <button
                  key={cat}
                  className={`px-4 py-2 rounded-full border transition text-sm font-medium ${searchTerm.toLowerCase() === cat.toLowerCase() ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-500 border-blue-200 hover:bg-blue-50'}`}
                  onClick={() => setSearchTerm(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Doctor horizontal scroll */}
            <div className="overflow-x-auto flex gap-4 pb-2">
              {filteredMedecins.length > 0 ? (
                filteredMedecins.map(medecin => (
                  <div
                    key={medecin.id_medecin} 
                    className={`min-w-[260px] bg-white rounded-2xl shadow-md p-5 flex flex-col items-center gap-2 cursor-pointer hover:shadow-lg transition border-2 ${selectedMedecin?.id_medecin === medecin.id_medecin ? 'border-blue-500' : 'border-transparent'}`}
                    onClick={() => setSelectedMedecin(medecin)}
                  >
                    <img
                      src={medecin.photo_profil ? `${API_STORAGE_URL}${medecin.photo_profil}` : '/default-avatar.png'}
                      alt={medecin.nom}
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-100"
                    />
                    <span className="font-semibold text-lg text-gray-900 text-center">Dr. {medecin.nom} {medecin.prenom}</span>
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-semibold">{medecin.specialite}</span>
                    <span className="text-gray-400 text-xs mt-1">{medecin.ville}</span>
                  </div>
                ))
              ) : (
                <span className="text-gray-400">Aucun médecin ne correspond à votre recherche.</span>
              )}
            </div>

            {/* Calendar section */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Choisir une date et un créneau</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedDate(prev => prev ? addDays(prev, -7) : undefined)}></Button>
                  <span className="font-semibold text-gray-600">{selectedDate ? format(selectedDate, 'MMMM yyyy') : 'Sélectionnez une date'}</span>
                  <Button variant="outline" onClick={() => setSelectedDate(prev => prev ? addDays(prev, 7) : undefined)}></Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 mb-6">
                {eachDayOfInterval({ start: startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 }), end: endOfWeek(selectedDate || new Date(), { weekStartsOn: 1 }) }).map(day => (
                  <button
                    key={day.toISOString()}
                    className={`flex flex-col items-center justify-center rounded-xl border px-2 py-2 transition h-16 ${isSameDay(day, selectedDate || new Date()) ? 'bg-blue-500 text-white border-blue-500' : isToday(day) ? 'border-blue-200 bg-blue-50 text-blue-700' : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <span className="text-xs font-semibold">{format(day, 'EEE')}</span>
                    <span className="text-lg font-bold">{format(day, 'dd')}</span>
                  </button>
                ))}
              </div>
              
              {/* MODIFIÉ : Boutons de créneaux maintenant cliquables */}
              <div className="flex flex-wrap gap-3 mb-6 justify-center">
                {selectedMedecin ? (
                  creneauxDisponibles.length > 0 ? (
                    creneauxDisponibles.map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)} // AJOUTÉ : Gestionnaire de clic
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition min-w-[80px] 
                          ${selectedTime === time 
                            ? 'bg-blue-500 text-white border-blue-500' // Style pour le créneau sélectionné
                            : 'bg-white hover:bg-blue-50 border-blue-200 text-blue-700' // Style par défaut
                          }`}
                      >
                        {time}
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-500">Aucun créneau disponible pour cette date</p>
                  )
                ) : (
                  <p className="text-gray-500">Veuillez sélectionner un médecin pour voir les disponibilités</p>
                )}
              </div>
              
              {/* MODIFIÉ : Bouton "Reservez" maintenant fonctionnel */}
              <div className="flex justify-end">
                <Button 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded-lg font-semibold"
                    onClick={handleOpenBooking} // AJOUTÉ : Ouvre le dialogue de réservation
                    disabled={!selectedMedecin || !selectedDate || !selectedTime} // AJOUTÉ : Désactivé si rien n'est sélectionné
                >
                    Reservez
                </Button>
              </div>
            </div>
        </main>
        
        {/* Sidebar: Doctor details */}
        <aside className="lg:col-span-1 space-y-6 bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center h-fit">
          {selectedMedecin ? (
            <>
              <div className="flex flex-col items-center mb-4 text-center">
                <img
                  src={selectedMedecin.photo_profil ? `${API_STORAGE_URL}${selectedMedecin.photo_profil}` : '/default-avatar.png'}
                  alt={selectedMedecin.nom}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Dr. {selectedMedecin.nom} {selectedMedecin.prenom}</h3>
                <p className="text-blue-500 font-medium">{selectedMedecin.specialite}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm font-medium">5.0</span>
                </div>
              </div>
              <div className="mb-4 w-full">
                <h4 className="font-semibold text-gray-700 mb-1">Biographie</h4>
                <p className="text-sm text-gray-600">
                  {selectedMedecin.description || 'Aucune biographie disponible.'}
                </p>
              </div>
              <div className="mb-4 w-full">
                <h4 className="font-semibold text-gray-700 mb-1">Localisation</h4>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21c-4.418 0-8-5.373-8-10A8 8 0 1 1 20 11c0 4.627-3.582 10-8 10z"/><circle cx="12" cy="11" r="3"/></svg>
                  {selectedMedecin.ville || 'Non renseigné'}
                </div>
              </div>
              {/* Le bouton ici peut être supprimé si vous voulez forcer la sélection via le calendrier */}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
              <span className="text-5xl mb-2">👨‍⚕️</span>
              <span className="text-lg">Veuillez sélectionner un médecin dans la liste ci-dessus</span>
            </div>
          )}
        </aside>

        {/* MODIFIÉ : Le dialogue reçoit maintenant toutes les informations nécessaires */}
        {selectedMedecin && selectedDate && selectedTime && (
            <BookingDialog
                isOpen={isBookingDialogOpen}
                onClose={() => setIsBookingDialogOpen(false)}
                medecin={selectedMedecin}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onAppointmentBooked={handleAppointmentBooked}
            />
        )}
      </div>
    </div>
    );
}; 
export default PatientConsultation;

