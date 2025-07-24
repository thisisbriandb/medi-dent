'use client';

import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { medicalService, type DossierMedical, type UpdateDossierMedicalData } from '@/app/services/MedicalService';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const DocumentsPage = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [dossier, setDossier] = useState<DossierMedical | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editedData, setEditedData] = useState<UpdateDossierMedicalData>({
    groupe_sanguin: '',
    notes_medicales: '',
    poids: 0,
    taille: 0,
    allergies: '',
    antecedents: '',
    traitements: '',
  
    observations: ''
  });

 // Dans DocumentsPage.tsx

useEffect(() => {
  // Gardez cette condition
  if (isAuthLoading || !isAuthenticated || !user) {
    return;
  }
  
  // Modification ici pour accéder à id_patient dans l'objet patient
  if (user.role !== 'patient' || !user.patient?.id_patient) {
    console.error("Données utilisateur incomplètes : id_patient manquant.", user);
    return;
  }

  const fetchDossierMedical = async () => {
    try {
      // Utiliser id_patient depuis l'objet patient
      const data = await medicalService.getDossierMedical(user.patient.id_patient);
      setDossier(data);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError("Erreur lors du chargement du dossier médical.");
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  fetchDossierMedical();
}, [user, isAuthLoading, isAuthenticated]);

  const handleCreateDossier = async () => {
    if (!editedData.groupe_sanguin) {
      setError("Le groupe sanguin est requis.");
      return;
    }

    if (!user?.patient?.id_patient) {
      setError("Identification du patient impossible");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Passer l'ID patient depuis l'objet patient
      const newDossier = await medicalService.createDossierMedical({
        ...editedData,
        id_patient: user.patient.id_patient
      });
      setDossier(newDossier);
      setSuccessMessage("Dossier médical créé avec succès");
      setIsCreating(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la création du dossier médical");
      console.error("Erreur détaillée:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Vérification de la taille du fichier (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("Le fichier dépasse 10MB.");
      return;
    }

    if (!user?.patient?.id_patient || !dossier) {
      setError("Dossier médical non trouvé.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await medicalService.addDocument(dossier.id_dossier, file);
      
      // Rafraîchir le dossier pour avoir le nouveau document_url
      const updatedDossier = await medicalService.getDossierMedical(user.patient.id_patient);
      setDossier(updatedDossier);
      
      setSuccessMessage("Document téléchargé avec succès");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Erreur upload:", err);
      setError("Erreur lors du téléchargement du document.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!dossier || !user?.patient?.id_patient) {
      setError("Impossible de mettre à jour le dossier");
      return;
    }

    try {
      setError(null);
      const updated = await medicalService.updateDossierMedical(dossier.id_dossier, {
        ...editedData,
        id_patient: user.patient.id_patient
      });

      setDossier(updated);
      setIsEditing(false);
      setSuccessMessage("Dossier mis à jour avec succès");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Erreur mise à jour:", err);
      setError(err.response?.data?.message || "Erreur lors de la mise à jour du dossier");
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dossier && !isCreating) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold mb-4">Dossier Médical</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              Vous n'avez pas encore de dossier médical.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Créer mon dossier médical
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-center mb-4">Créer mon dossier médical</h1>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-3 text-center">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="text-gray-600 text-sm">Groupe sanguin *</label>
            <select
              value={editedData.groupe_sanguin}
              onChange={(e) => setEditedData({ ...editedData, groupe_sanguin: e.target.value })}
              className="w-full border rounded p-2 mt-1"
            >
              <option value="">Sélectionner</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((groupe) => (
                <option key={groupe} value={groupe}>{groupe}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-gray-600 text-sm">Poids (kg)</label>
            <input
              type="number"
              value={editedData.poids || ''}
              onChange={(e) => setEditedData({ ...editedData, poids: parseFloat(e.target.value) })}
              className="w-full border rounded p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-gray-600 text-sm">Taille (cm)</label>
            <input
              type="number"
              value={editedData.taille || ''}
              onChange={(e) => setEditedData({ ...editedData, taille: parseFloat(e.target.value) })}
              className="w-full border rounded p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-gray-600 text-sm">Allergies</label>
            <textarea
              value={editedData.allergies || ''}
              onChange={(e) => setEditedData({ ...editedData, allergies: e.target.value })}
              rows={2}
              className="w-full border rounded p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-gray-600 text-sm">Antécédents</label>
            <textarea
              value={editedData.antecedents || ''}
              onChange={(e) => setEditedData({ ...editedData, antecedents: e.target.value })}
              rows={2}
              className="w-full border rounded p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-gray-600 text-sm">Traitements</label>
            <textarea
              value={editedData.traitements || ''}
              onChange={(e) => setEditedData({ ...editedData, traitements: e.target.value })}
              rows={2}
              className="w-full border rounded p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-gray-600 text-sm">Observations</label>
            <textarea
              value={editedData.observations || ''}
              onChange={(e) => setEditedData({ ...editedData, observations: e.target.value })}
              rows={4}
              className="w-full border rounded p-2 mt-1"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsCreating(false)}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateDossier}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Mon Dossier Médical</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-3 text-center">{error}</div>}
      {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded mb-3 text-center">{successMessage}</div>}

      <Accordion type="single" collapsible className="w-full space-y-2">

        {/* Informations générales */}
        <AccordionItem value="infos">
          <AccordionTrigger>📋 Informations Générales</AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-between items-center mb-2">
           
<button
  onClick={() => {
    if (!isEditing && dossier) {
      setEditedData({
        groupe_sanguin: dossier.groupe_sanguin || '',
        notes_medicales: dossier.notes_medicales || '',
        poids: dossier.poids || 0,
        taille: dossier.taille || 0,
        allergies: dossier.allergies || '',
        antecedents: dossier.antecedents || '',
        traitements: dossier.traitements || '',
        observations: dossier.observations || ''
      });
    }
    setIsEditing(!isEditing);
  }}
  className="text-blue-600 hover:underline text-sm"
>
  {isEditing ? 'Annuler' : 'Modifier'}
</button>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-gray-600 text-sm">Groupe sanguin:</p>
                {isEditing ? (
                  <select
                    value={editedData.groupe_sanguin}
                    onChange={(e) => setEditedData({ ...editedData, groupe_sanguin: e.target.value })}
                    className="w-full border rounded p-1"
                  >
                    <option value="">Sélectionner</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((groupe) => (
                      <option key={groupe} value={groupe}>{groupe}</option>
                    ))}
                  </select>
                ) : (
                  <p className="font-medium">{dossier?.groupe_sanguin || "Non renseigné"}</p>
                )}
              </div>
              <div>
                <p className="text-gray-600 text-sm">Poids (kg):</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedData.poids || ''}
                    onChange={(e) => setEditedData({ ...editedData, poids: parseFloat(e.target.value) })}
                    className="w-full border rounded p-1"
                  />
                ) : (
                  <p className="font-medium">{dossier?.poids || "Non renseigné"}</p>
                )}
              </div>
              <div>
                <p className="text-gray-600 text-sm">Taille (cm):</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedData.taille || ''}
                    onChange={(e) => setEditedData({ ...editedData, taille: parseFloat(e.target.value) })}
                    className="w-full border rounded p-1"
                  />
                ) : (
                  <p className="font-medium">{dossier?.taille || "Non renseigné"}</p>
                )}
              </div>
              <div>
                <p className="text-gray-600 text-sm">Dernière mise à jour:</p>
                <p className="font-medium">{dossier?.date_mise_a_jour ? new Date(dossier.date_mise_a_jour).toLocaleDateString() : "Aucune mise à jour"}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Notes médicales */}
        <AccordionItem value="notes">
          <AccordionTrigger>🩺 Notes Médicales</AccordionTrigger>
          <AccordionContent>
            {isEditing ? (
              <textarea
                value={editedData.notes_medicales || ''}
                onChange={(e) => setEditedData({ ...editedData, notes_medicales: e.target.value })}
                rows={4}
                className="w-full border rounded p-2"
              />
            ) : (
              <p className="text-gray-700">{dossier?.notes_medicales || "Aucune note médicale disponible."}</p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Allergies */}
        <AccordionItem value="allergies">
          <AccordionTrigger>🤧 Allergies</AccordionTrigger>
          <AccordionContent>
            {isEditing ? (
              <textarea
                value={editedData.allergies || ''}
                onChange={(e) => setEditedData({ ...editedData, allergies: e.target.value })}
                rows={4}
                className="w-full border rounded p-2"
              />
            ) : (
              <p className="text-gray-700">{dossier?.allergies || "Aucune allergie disponible."}</p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Antécédents */}
        <AccordionItem value="antecedents">
          <AccordionTrigger>📜 Antécédents</AccordionTrigger>
          <AccordionContent>
            {isEditing ? (
              <textarea
                value={editedData.antecedents || ''}
                onChange={(e) => setEditedData({ ...editedData, antecedents: e.target.value })}
                rows={4}
                className="w-full border rounded p-2"
              />
            ) : (
              <p className="text-gray-700">{dossier?.antecedents || "Aucun antécédent disponible."}</p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Traitements */}
        <AccordionItem value="traitements">
          <AccordionTrigger>💊 Traitements</AccordionTrigger>
          <AccordionContent>
            {isEditing ? (
              <textarea
                value={editedData.traitements || ''}
                onChange={(e) => setEditedData({ ...editedData, traitements: e.target.value })}
                rows={4}
                className="w-full border rounded p-2"
              />
            ) : (
              <p className="text-gray-700">{dossier?.traitements || "Aucun traitement disponible."}</p>
            )}
          </AccordionContent>
        </AccordionItem>

      

        {/* Observations */}
        <AccordionItem value="observations">
          <AccordionTrigger>📝 Observations</AccordionTrigger>
          <AccordionContent>
            {isEditing ? (
              <textarea
                value={editedData.observations || ''}
                onChange={(e) => setEditedData({ ...editedData, observations: e.target.value })}
                rows={4}
                className="w-full border rounded p-2"
              />
            ) : (
              <p className="text-gray-700">{dossier?.observations || "Aucune observation disponible."}</p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Upload de document */}
        <AccordionItem value="documents">
          <AccordionTrigger>📑 Documents</AccordionTrigger>
          <AccordionContent>
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded cursor-pointer p-6 hover:bg-gray-50">
              <p className="text-gray-600">Cliquez ou glissez pour télécharger (PDF, JPG, PNG)</p>
              <input id="dropzone-file" type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" />
            </label>
            {dossier?.document_url && (
              <div className="mt-4 text-center">
                <a href={dossier.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  Voir le document actuel
                </a>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {isEditing && (
        <div className="flex justify-end mt-4">
          <button
            onClick={handleUpdate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Sauvegarder
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
