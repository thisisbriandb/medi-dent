'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PatientFormDialog from '@/app/components/patients/PatientFormDialog';
import PatientSupabaseService from '@/app/services/PatientSupabaseService';
import type { PatientFormData } from '@/app/components/patients/PatientFormDialog';

export default function NouveauPatientPage() {
  const router = useRouter();
  const [open] = useState(true);

  const handleSubmit = async (data: PatientFormData) => {
    const patient = await PatientSupabaseService.create({
      nom: data.nom,
      prenom: data.prenom,
      date_naissance: data.date_naissance || null,
      sexe: data.sexe || null,
      telephone: data.telephone || null,
      email: data.email || null,
      adresse: data.adresse || null,
      profession: data.profession || null,
      groupe_sanguin: data.groupe_sanguin || null,
      allergies: data.allergies || null,
      antecedents: data.antecedents || null,
      traitements_en_cours: data.traitements_en_cours || null,
      contact_urgence_nom: data.contact_urgence_nom || null,
      contact_urgence_telephone: data.contact_urgence_telephone || null,
      contact_urgence_lien: data.contact_urgence_lien || null,
    });
    router.push(`/patients/${patient.id}`);
  };

  const handleClose = () => {
    router.push('/patients');
  };

  return (
    <PatientFormDialog
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
    />
  );
}
