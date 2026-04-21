'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  Calendar,
  User,
  ClipboardList,
  FileText,
  Save,
  X,
} from 'lucide-react';
import ConsultationService from '@/app/services/ConsultationService';
import type { Consultation } from '@/types/consultation.types';

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400 sm:w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800 whitespace-pre-wrap">{value || '—'}</span>
    </div>
  );
}

export default function ConsultationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id as string;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editMotif, setEditMotif] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCompteRendu, setEditCompteRendu] = useState('');
  const [editActes, setEditActes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConsultation = useCallback(async () => {
    setIsLoading(true);
    const data = await ConsultationService.getById(consultationId);
    setConsultation(data);
    if (data) {
      setEditMotif(data.motif || '');
      setEditNotes(data.notes_cliniques || '');
      setEditCompteRendu(data.compte_rendu || '');
      setEditActes(data.actes_realises || '');
    }
    setIsLoading(false);
  }, [consultationId]);

  useEffect(() => {
    fetchConsultation();
  }, [fetchConsultation]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await ConsultationService.update(consultationId, {
        motif: editMotif || null,
        notes_cliniques: editNotes || null,
        compte_rendu: editCompteRendu || null,
        actes_realises: editActes || null,
      });
      await fetchConsultation();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (consultation) {
      setEditMotif(consultation.motif || '');
      setEditNotes(consultation.notes_cliniques || '');
      setEditCompteRendu(consultation.compte_rendu || '');
      setEditActes(consultation.actes_realises || '');
    }
    setIsEditing(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Consultation introuvable</p>
        <button
          onClick={() => router.push('/consultation')}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/consultation')}
            className="mt-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Consultation
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                {formatDateTime(consultation.date_consultation)}
              </span>
            </div>
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Modifier
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Patient info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Patient</h2>
        </div>
        {consultation.patient ? (
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-gray-600">
                {consultation.patient.prenom?.[0]}{consultation.patient.nom?.[0]}
              </span>
            </div>
            <div>
              <button
                onClick={() => router.push(`/patients/${consultation.patient!.id}`)}
                className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
              >
                {consultation.patient.prenom} {consultation.patient.nom}
              </button>
              <p className="text-xs text-gray-400 font-mono">{consultation.patient.numero_dossier}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Patient non renseigné</p>
        )}
        {consultation.praticien && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">Praticien</p>
            <p className="text-sm text-gray-700 mt-0.5">
              Dr. {consultation.praticien.prenom} {consultation.praticien.nom}
            </p>
          </div>
        )}
      </div>

      {/* Consultation details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Détails</h2>
        </div>

        {isEditing ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Motif</label>
              <input
                type="text"
                value={editMotif}
                onChange={(e) => setEditMotif(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Actes réalisés</label>
              <textarea
                value={editActes}
                onChange={(e) => setEditActes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes cliniques</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Compte rendu</label>
              <textarea
                value={editCompteRendu}
                onChange={(e) => setEditCompteRendu(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            <InfoRow label="Motif" value={consultation.motif} />
            <InfoRow label="Actes réalisés" value={consultation.actes_realises} />
            <InfoRow label="Notes cliniques" value={consultation.notes_cliniques} />
            <InfoRow label="Compte rendu" value={consultation.compte_rendu} />
          </div>
        )}
      </div>

      {/* IA report */}
      {consultation.compte_rendu_ia && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Analyse IA
            </h2>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {consultation.compte_rendu_ia}
          </p>
        </div>
      )}
    </div>
  );
}
