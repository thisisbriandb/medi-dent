// DashboardMedecin.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DossierMedical } from "@/app/services/MedicalService";
import axios from "axios";

interface Patient {
  id_patient: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  dossier_medical?: DossierMedical;
}

interface RDV {
  id_rdv: number;
  date_rdv: string;
  statut: string;
  id_patient: number;
  patient: Patient;
}

export default function DashboardMedecin() {
  const [patientsRecents, setPatientsRecents] = useState<Patient[]>([]);
  const [rdvAVenir, setRdvAVenir] = useState<RDV[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const patientsRes = await axios.get("/doctor/patients/recent");
      const rdvRes = await axios.get("/doctor/appointments/today");
      setPatientsRecents(patientsRes.data.data);
      setRdvAVenir(rdvRes.data.data);
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Patients récents */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">Patients récents</h2>
          {patientsRecents.map((patient) => (
            <div
              key={patient.id_patient}
              className="flex justify-between items-center mb-2 border-b pb-2"
            >
              <div>
                <p className="font-medium">{patient.nom} {patient.prenom}</p>
                <p className="text-sm text-gray-500">
                  Né le : {patient.date_naissance}
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Dossier</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dossier de {patient.nom}</DialogTitle>
                  </DialogHeader>
                  {patient.dossier_medical ? (
                    <div className="text-sm space-y-2">
                      <p><strong>Groupe sanguin :</strong> {patient.dossier_medical.groupe_sanguin}</p>
                      <p><strong>Poids :</strong> {patient.dossier_medical.poids} kg</p>
                      <p><strong>Taille :</strong> {patient.dossier_medical.taille} cm</p>
                      <p><strong>Allergies :</strong> {patient.dossier_medical.allergies}</p>
                      <p><strong>Antécédents :</strong> {patient.dossier_medical.antecedents}</p>
                      <p><strong>Traitements :</strong> {patient.dossier_medical.traitements}</p>
                      <p><strong>Observations :</strong> {patient.dossier_medical.observations}</p>
                    </div>
                  ) : (
                    <p>Aucun dossier médical disponible.</p>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* RDV à venir */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">RDV à venir</h2>
          {rdvAVenir.map((rdv) => (
            <div
              key={rdv.id_rdv}
              className="flex justify-between items-center mb-2 border-b pb-2"
            >
              <div>
                <p className="font-medium">{rdv.patient.nom} {rdv.patient.prenom}</p>
                <p className="text-sm text-gray-500">
                  {rdv.date_rdv}
                </p>
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Dossier</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Dossier de {rdv.patient.nom}</DialogTitle>
                    </DialogHeader>
                    <p>Dossier en consultation rapide...</p>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm">Ordonnance</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ordonnance pour {rdv.patient.nom}</DialogTitle>
                    </DialogHeader>
                    <textarea className="w-full p-2 border rounded" rows={6} placeholder="Rédiger ici..." />
                    <Button className="mt-2">Enregistrer</Button>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Outils rapides */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">Outils rapides</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full mb-2">➕ Nouveau compte-rendu</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau compte-rendu</DialogTitle>
              </DialogHeader>
              <textarea className="w-full p-2 border rounded" rows={6} placeholder="Rédiger ici..." />
              <Button className="mt-2">Enregistrer</Button>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full mb-2">📝 Nouvelle ordonnance</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle ordonnance</DialogTitle>
              </DialogHeader>
              <textarea className="w-full p-2 border rounded" rows={6} placeholder="Ordonnance..." />
              <Button className="mt-2">Enregistrer</Button>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
