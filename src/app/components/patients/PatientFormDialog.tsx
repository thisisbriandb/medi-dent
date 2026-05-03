'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Patient, PatientUpdate, Sexe } from '@/types/patient.types';

interface PatientFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PatientFormData) => Promise<void>;
  patient?: Patient | null;
}

export interface PatientFormData {
  nom: string;
  prenom: string;
  date_naissance?: string | null;
  sexe?: Sexe | null;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  profession?: string | null;
  groupe_sanguin?: string | null;
  allergies?: string | null;
  antecedents?: string | null;
  traitements_en_cours?: string | null;
  contact_urgence_nom?: string | null;
  contact_urgence_telephone?: string | null;
  contact_urgence_lien?: string | null;
}

const INITIAL_FORM: PatientFormData = {
  nom: '',
  prenom: '',
  date_naissance: '',
  sexe: null,
  telephone: '',
  email: '',
  adresse: '',
  profession: '',
  groupe_sanguin: '',
  allergies: '',
  antecedents: '',
  traitements_en_cours: '',
  contact_urgence_nom: '',
  contact_urgence_telephone: '',
  contact_urgence_lien: '',
};

const GROUPES_SANGUINS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const FIELD_CLASS =
  'w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';
const TEXTAREA_CLASS = `${FIELD_CLASS} resize-none`;

export default function PatientFormDialog({ open, onClose, onSubmit, patient }: PatientFormDialogProps) {
  const [form, setForm] = useState<PatientFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!patient;

  useEffect(() => {
    if (patient) {
      setForm({
        nom: patient.nom,
        prenom: patient.prenom,
        date_naissance: patient.date_naissance || '',
        sexe: patient.sexe,
        telephone: patient.telephone || '',
        email: patient.email || '',
        adresse: patient.adresse || '',
        profession: patient.profession || '',
        groupe_sanguin: patient.groupe_sanguin || '',
        allergies: patient.allergies || '',
        antecedents: patient.antecedents || '',
        traitements_en_cours: patient.traitements_en_cours || '',
        contact_urgence_nom: patient.contact_urgence_nom || '',
        contact_urgence_telephone: patient.contact_urgence_telephone || '',
        contact_urgence_lien: patient.contact_urgence_lien || '',
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setError(null);
  }, [patient, open]);

  const handleChange = (field: keyof PatientFormData, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.nom.trim() || !form.prenom.trim()) {
      setError('Le nom et le prénom sont obligatoires.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Modifier le patient' : 'Nouveau patient'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Section Identité */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-[0.12em] mb-4">
              Identité
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  className={FIELD_CLASS}
                  placeholder="Nom de famille"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prénom <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.prenom}
                  onChange={(e) => handleChange('prenom', e.target.value)}
                  className={FIELD_CLASS}
                  placeholder="Prénom"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={form.date_naissance || ''}
                  onChange={(e) => handleChange('date_naissance', e.target.value || null)}
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sexe
                </label>
                <select
                  value={form.sexe || ''}
                  onChange={(e) => handleChange('sexe', (e.target.value as Sexe) || null)}
                  className={FIELD_CLASS}
                >
                  <option value="">Non spécifié</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Profession
                </label>
                <input
                  type="text"
                  value={form.profession || ''}
                  onChange={(e) => handleChange('profession', e.target.value || null)}
                  className={FIELD_CLASS}
                  placeholder="Profession"
                />
              </div>
            </div>
          </section>

          {/* Section Contact */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-[0.12em] mb-4">
              Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={form.telephone || ''}
                  onChange={(e) => handleChange('telephone', e.target.value || null)}
                  className={FIELD_CLASS}
                  placeholder="+224 6XX XX XX XX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => handleChange('email', e.target.value || null)}
                  className={FIELD_CLASS}
                  placeholder="patient@email.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adresse
                </label>
                <input
                  type="text"
                  value={form.adresse || ''}
                  onChange={(e) => handleChange('adresse', e.target.value || null)}
                  className={FIELD_CLASS}
                  placeholder="Adresse complète"
                />
              </div>
            </div>
          </section>

          {/* Section Médical */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-[0.12em] mb-4">
              Médical
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Groupe sanguin
                </label>
                <select
                  value={form.groupe_sanguin || ''}
                  onChange={(e) => handleChange('groupe_sanguin', e.target.value || null)}
                  className={FIELD_CLASS}
                >
                  <option value="">Non renseigné</option>
                  {GROUPES_SANGUINS.map((gs) => (
                    <option key={gs} value={gs}>{gs}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Allergies
                </label>
                <input
                  type="text"
                  value={form.allergies || ''}
                  onChange={(e) => handleChange('allergies', e.target.value || null)}
                  className={FIELD_CLASS}
                  placeholder="Ex: Pénicilline, Latex..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Antécédents médicaux
                </label>
                <textarea
                  value={form.antecedents || ''}
                  onChange={(e) => handleChange('antecedents', e.target.value || null)}
                  rows={3}
                  className={TEXTAREA_CLASS}
                  placeholder="Antécédents médicaux et chirurgicaux..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Traitements en cours
                </label>
                <textarea
                  value={form.traitements_en_cours || ''}
                  onChange={(e) => handleChange('traitements_en_cours', e.target.value || null)}
                  rows={2}
                  className={TEXTAREA_CLASS}
                  placeholder="Traitements médicamenteux en cours..."
                />
              </div>
            </div>
          </section>

          {/* Section Contact d'urgence */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-[0.12em] mb-4">
              Contact d'urgence
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom
                </label>
                <input
                  type="text"
                  value={form.contact_urgence_nom || ''}
                  onChange={(e) => handleChange('contact_urgence_nom', e.target.value || null)}
                  className={FIELD_CLASS}
                  placeholder="Nom complet"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={form.contact_urgence_telephone || ''}
                  onChange={(e) => handleChange('contact_urgence_telephone', e.target.value || null)}
                  className={FIELD_CLASS}
                  placeholder="+224 6XX XX XX XX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Lien de parenté
                </label>
                <input
                  type="text"
                  value={form.contact_urgence_lien || ''}
                  onChange={(e) => handleChange('contact_urgence_lien', e.target.value || null)}
                  className={FIELD_CLASS}
                  placeholder="Ex: Conjoint, Parent..."
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer le patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
