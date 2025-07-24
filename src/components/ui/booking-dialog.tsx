"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Creneau } from '@/types/creneaux.types';
import { Medecin } from '@/types/medecin.types';
import { CreneauxService } from '@/app/services/CreneauxService';
import { AppointmentService } from '@/app/services/AppointmentService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface BookingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    medecin: Medecin | null;
    selectedDate: Date;
    selectedTime: string;
    onAppointmentBooked: () => void;
}

export const BookingDialog: React.FC<BookingDialogProps> = ({ 
    isOpen, 
    onClose, 
    medecin, 
    selectedDate,
    selectedTime,
    onAppointmentBooked 
}) => {
    const { user } = useAuth();
    const [creneaux, setCreneaux] = useState<Creneau[]>([]);
    const [selectedCreneau, setSelectedCreneau] = useState<Creneau | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && medecin && selectedDate) {
            const fetchCreneaux = async () => {
                setLoading(true);
                setError(null);
                try {
                    // Get creneaux for the specific date
                    const startOfDay = new Date(selectedDate);
                    const endOfDay = new Date(selectedDate);
                    endOfDay.setHours(23, 59, 59);
                    
                    const response = await AppointmentService.getAppointmentsByDoctor(
                        medecin.id_medecin.toString(),
                        startOfDay,
                        endOfDay
                    );

                    if (response.success && Array.isArray(response.data)) {
                        setCreneaux(response.data);
                        
                        // Try to find and auto-select the matching creneau
                        const matchingCreneau = response.data.find(c => 
                            c.date_creneau === format(selectedDate, 'yyyy-MM-dd') &&
                            c.heure_debut.slice(0, 5) <= selectedTime &&
                            c.heure_fin.slice(0, 5) > selectedTime
                        );
                        
                        if (matchingCreneau) {
                            setSelectedCreneau(matchingCreneau);
                        }
                    } else {
                        setCreneaux([]);
                    }
                } catch (err) {
                    setError("Impossible de charger les créneaux disponibles.");
                    console.error(err);
                }
                setLoading(false);
            };
            fetchCreneaux();
        }
    }, [isOpen, medecin, selectedDate, selectedTime]);

    const handleBooking = async () => {
        if (!medecin || !selectedDate || !selectedTime || !user) {
            setError("Informations manquantes pour la réservation.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // First, get the creneau for this date and time
            const startOfDay = new Date(selectedDate);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59);
            
            const creneauxResponse = await AppointmentService.getAppointmentsByDoctor(
                medecin.id_medecin.toString(),
                startOfDay,
                endOfDay
            );

            if (!creneauxResponse.success || !Array.isArray(creneauxResponse.data)) {
                throw new Error("Impossible de récupérer les créneaux");
            }

            console.log('Available creneaux:', creneauxResponse.data);
            console.log('Looking for date:', format(selectedDate, 'yyyy-MM-dd'));
            console.log('Looking for time:', selectedTime);

            // Find the matching creneau that contains our selected time
            const creneau = creneauxResponse.data.find(c => {
                const creneauDate = c.date_creneau;
                const timeStart = c.heure_debut.slice(0, 5); // Get HH:mm format
                const timeEnd = c.heure_fin.slice(0, 5); // Get HH:mm format
                
                console.log('Comparing with creneau:', {
                    date: creneauDate,
                    start: timeStart,
                    end: timeEnd,
                    selectedTime
                });

                // Check if the date matches and the selected time falls within the creneau's time range
                return creneauDate === format(selectedDate, 'yyyy-MM-dd') &&
                       timeStart <= selectedTime &&
                       selectedTime < timeEnd;
            });

            if (!creneau) {
                setError("Aucun créneau disponible pour l'horaire sélectionné. Veuillez choisir un autre horaire.");
                throw new Error("Créneau non trouvé");
            }
            
            console.log('Found matching creneau:', creneau);

            await AppointmentService.createAppointment({
                patientId: user.id.toString(),
                doctorId: medecin.id_medecin.toString(),
                date: selectedDate,
                time: selectedTime,
                duration: 30,
                title: `Rendez-vous avec Dr. ${medecin.nom}`,
                id_creneau: creneau.id_creneau.toString(),
                motif: "Consultation", // Default motif
            });
            onAppointmentBooked();
            onClose();
        } catch (err) {
            setError("La prise de rendez-vous a échoué.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Prendre rendez-vous avec Dr. {medecin?.prenom}</DialogTitle>
                    <DialogDescription>
                        Sélectionnez un créneau disponible ci-dessous.
                    </DialogDescription>
                </DialogHeader>
                {loading && <p>Chargement des créneaux...</p>}
                {error && <p className="text-red-500">{error}</p>}
                <div className="grid grid-cols-3 gap-2 py-4">
                    {creneaux.map(creneau => (
                        <Button
                            key={creneau.id_creneau}
                            variant={selectedCreneau?.id_creneau === creneau.id_creneau ? "default" : "outline"}
                            onClick={() => setSelectedCreneau(creneau)}
                        >
                            {format(new Date(creneau.date_creneau), 'HH:mm')}
                        </Button>
                    ))}
                </div>
                {creneaux.length === 0 && !loading && <p>Aucun créneau disponible.</p>}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button onClick={handleBooking} disabled={!selectedCreneau || loading}>
                        {loading ? "Réservation..." : "Confirmer le RDV"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
