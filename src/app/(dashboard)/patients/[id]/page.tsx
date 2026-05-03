'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  FileText,
  Receipt,
  ClipboardList,
  AlertTriangle,
  User,
  CircleDot,
} from 'lucide-react';
import PatientSupabaseService from '@/app/services/PatientSupabaseService';
import PatientFormDialog from '@/app/components/patients/PatientFormDialog';
import type { Patient, ConsultationRow, FactureRow, OrdonnanceRow, StatutFacture } from '@/types/patient.types';
import type { PatientFormData } from '@/app/components/patients/PatientFormDialog';
import Odontogramme from '@/app/components/odontogramme/Odontogramme';
import OdontogrammeService from '@/app/services/OdontogrammeService';
import type { OdontogrammeData, Odontogramme as OdontogrammeType } from '@/types/odontogramme.types';

type TabKey = 'identite' | 'medical' | 'odontogramme' | 'consultations' | 'factures' | 'ordonnances';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'identite', label: 'Identité', icon: <User className="w-4 h-4" /> },
  { key: 'medical', label: 'Médical', icon: <Heart className="w-4 h-4" /> },
  { key: 'odontogramme', label: 'Odontogramme', icon: <CircleDot className="w-4 h-4" /> },
  { key: 'consultations', label: 'Consultations', icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'factures', label: 'Factures', icon: <Receipt className="w-4 h-4" /> },
  { key: 'ordonnances', label: 'Ordonnances', icon: <FileText className="w-4 h-4" /> },
];

// ─── Helpers ───

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

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

function formatMontant(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(value) + ' FCFA';
}

function statutLabel(statut: StatutFacture): string {
  const map: Record<StatutFacture, string> = {
    brouillon: 'Brouillon',
    emise: 'Émise',
    payee: 'Payée',
    partiellement_payee: 'Partielle',
    annulee: 'Annulée',
    impayee: 'Impayée',
  };
  return map[statut] ?? statut;
}

function statutColor(statut: StatutFacture): string {
  switch (statut) {
    case 'brouillon':
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
    case 'payee':
      return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200';
    case 'emise':
      return 'bg-blue-100 text-blue-800 ring-1 ring-blue-200';
    case 'partiellement_payee':
      return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200';
    case 'impayee':
      return 'bg-rose-100 text-rose-800 ring-1 ring-rose-200';
    case 'annulee':
      return 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200';
    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  }
}

function calculateAge(dateNaissance: string | null): string | null {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} ans`;
}

// ─── InfoRow Component ───

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400 sm:w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value || '—'}</span>
    </div>
  );
}

// ─── Main Page ───

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('identite');
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  // Tab data
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [factures, setFactures] = useState<FactureRow[]>([]);
  const [ordonnances, setOrdonnances] = useState<OrdonnanceRow[]>([]);
  const [odontogrammeData, setOdontogrammeData] = useState<OdontogrammeData>({});
  const [odontogrammeNotes, setOdontogrammeNotes] = useState('');
  const [odontogrammeLoaded, setOdontogrammeLoaded] = useState(false);
  const [odontogrammeSaving, setOdontogrammeSaving] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);

  const fetchPatient = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await PatientSupabaseService.getById(patientId);
      setPatient(data);
    } catch (error) {
      console.error('Erreur chargement patient:', error);
      setPatient(null);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  // Load tab data on tab change
  useEffect(() => {
    if (!patientId) return;

    const loadTabData = async () => {
      setTabLoading(true);
      try {
        if (activeTab === 'consultations' && consultations.length === 0) {
          const data = await PatientSupabaseService.getConsultations(patientId);
          setConsultations(data);
        } else if (activeTab === 'factures' && factures.length === 0) {
          const data = await PatientSupabaseService.getFactures(patientId);
          setFactures(data);
        } else if (activeTab === 'ordonnances' && ordonnances.length === 0) {
          const data = await PatientSupabaseService.getOrdonnances(patientId);
          setOrdonnances(data);
        } else if (activeTab === 'odontogramme' && !odontogrammeLoaded) {
          const odonto = await OdontogrammeService.getByPatient(patientId);
          if (odonto) {
            setOdontogrammeData(odonto.data || {});
            setOdontogrammeNotes(odonto.notes || '');
          }
          setOdontogrammeLoaded(true);
        }
      } catch (err) {
        console.error('Erreur chargement onglet:', err);
      } finally {
        setTabLoading(false);
      }
    };

    loadTabData();
  }, [activeTab, patientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOdontogrammeSave = async (newData: OdontogrammeData, newNotes: string) => {
    setOdontogrammeSaving(true);
    try {
      await OdontogrammeService.save(patientId, newData, newNotes || null);
      setOdontogrammeData(newData);
      setOdontogrammeNotes(newNotes);
    } catch (err) {
      console.error('Erreur sauvegarde odontogramme:', err);
    } finally {
      setOdontogrammeSaving(false);
    }
  };

  const handleEdit = async (data: PatientFormData) => {
    await PatientSupabaseService.update(patientId, {
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
    await fetchPatient();
  };

  // ─── Loading ───

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Patient introuvable</p>
        <button
          onClick={() => router.push('/patients')}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const age = calculateAge(patient.date_naissance);

  // ─── Render ───

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/patients')}
            className="mt-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold text-gray-600">
                {patient.prenom?.[0]}{patient.nom?.[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.prenom} {patient.nom}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-400 font-mono">{patient.numero_dossier}</span>
                {age && <span className="text-sm text-gray-500">{age}</span>}
                {patient.sexe && (
                  <span className="text-sm text-gray-500">
                    {patient.sexe === 'M' ? 'Homme' : 'Femme'}
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    patient.est_actif ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  {patient.est_actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          Modifier
        </button>
      </div>

      {/* Quick info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {patient.telephone && (
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-5 py-4">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">{patient.telephone}</span>
          </div>
        )}
        {patient.email && (
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-5 py-4">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 truncate">{patient.email}</span>
          </div>
        )}
        {patient.adresse && (
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-5 py-4">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 truncate">{patient.adresse}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Tab headers */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {tabLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600" />
            </div>
          ) : (
            <>
              {activeTab === 'identite' && <TabIdentite patient={patient} />}
              {activeTab === 'medical' && <TabMedical patient={patient} />}
              {activeTab === 'odontogramme' && (
                <Odontogramme
                  initialData={odontogrammeData}
                  notes={odontogrammeNotes}
                  onSave={handleOdontogrammeSave}
                  saving={odontogrammeSaving}
                />
              )}
              {activeTab === 'consultations' && <TabConsultations data={consultations} />}
              {activeTab === 'factures' && <TabFactures data={factures} />}
              {activeTab === 'ordonnances' && <TabOrdonnances data={ordonnances} />}
            </>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <PatientFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
        patient={patient}
      />
    </div>
  );
}

// ─── Tab: Identité ───

function TabIdentite({ patient }: { patient: Patient }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          Informations personnelles
        </h3>
        <div className="space-y-0">
          <InfoRow label="Nom complet" value={`${patient.prenom} ${patient.nom}`} />
          <InfoRow label="Date de naissance" value={formatDate(patient.date_naissance)} />
          <InfoRow label="Sexe" value={patient.sexe === 'M' ? 'Masculin' : patient.sexe === 'F' ? 'Féminin' : null} />
          <InfoRow label="Profession" value={patient.profession} />
          <InfoRow label="N° dossier" value={patient.numero_dossier} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          Contact d'urgence
        </h3>
        <div className="space-y-0">
          <InfoRow label="Nom" value={patient.contact_urgence_nom} />
          <InfoRow label="Téléphone" value={patient.contact_urgence_telephone} />
          <InfoRow label="Lien de parenté" value={patient.contact_urgence_lien} />
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Médical ───

function TabMedical({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-0">
      <InfoRow label="Groupe sanguin" value={patient.groupe_sanguin} />
      <InfoRow label="Allergies" value={patient.allergies} />
      <InfoRow label="Antécédents" value={patient.antecedents} />
      <InfoRow label="Traitements en cours" value={patient.traitements_en_cours} />
      <InfoRow label="Dernière visite" value={formatDate(patient.derniere_visite)} />

      {patient.allergies && (
        <div className="mt-6 flex items-start gap-3 bg-red-50 rounded-lg p-4">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">Allergies signalées</p>
            <p className="text-sm text-red-600 mt-1">{patient.allergies}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Consultations ───

function TabConsultations({ data }: { data: ConsultationRow[] }) {
  if (data.length === 0) {
    return <EmptyTab message="Aucune consultation enregistrée" />;
  }

  return (
    <div className="space-y-3">
      {data.map((c) => (
        <div key={c.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-800">
              {c.motif || 'Consultation'}
            </p>
            {c.praticien && (
              <p className="text-xs text-gray-500">
                Dr. {c.praticien.prenom} {c.praticien.nom}
              </p>
            )}
            {c.notes_cliniques && (
              <p className="text-xs text-gray-400 line-clamp-2 max-w-lg mt-1">
                {c.notes_cliniques}
              </p>
            )}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
            {formatDateTime(c.date_consultation)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Factures ───

function TabFactures({ data }: { data: FactureRow[] }) {
  if (data.length === 0) {
    return <EmptyTab message="Aucune facture enregistrée" />;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-100">
          <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Numéro</th>
          <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Date</th>
          <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Total TTC</th>
          <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Payé</th>
          <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Reste</th>
          <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Statut</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {data.map((f) => (
          <tr key={f.id} className="hover:bg-gray-50 transition-colors">
            <td className="py-3 text-sm font-mono text-gray-600">{f.numero || '—'}</td>
            <td className="py-3 text-sm text-gray-500">{formatDate(f.date_emission)}</td>
            <td className="py-3 text-sm text-gray-800 text-right">{formatMontant(f.total_ttc)}</td>
            <td className="py-3 text-sm text-gray-500 text-right">{formatMontant(f.total_paye)}</td>
            <td className="py-3 text-sm text-gray-800 text-right font-medium">{formatMontant(f.reste_a_payer)}</td>
            <td className="py-3 text-right">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statutColor(f.statut)}`}>
                {statutLabel(f.statut)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Tab: Ordonnances ───

function TabOrdonnances({ data }: { data: OrdonnanceRow[] }) {
  if (data.length === 0) {
    return <EmptyTab message="Aucune ordonnance enregistrée" />;
  }

  return (
    <div className="space-y-3">
      {data.map((o) => (
        <div key={o.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-800">
              Ordonnance du {formatDate(o.created_at)}
            </p>
            {o.praticien && (
              <p className="text-xs text-gray-500">
                Dr. {o.praticien.prenom} {o.praticien.nom}
              </p>
            )}
            {o.notes_patient && (
              <p className="text-xs text-gray-400 line-clamp-2 max-w-lg mt-1">
                {o.notes_patient}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 ml-4">
            {o.pdf_url && (
              <a
                href={o.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                PDF
              </a>
            )}
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatDate(o.created_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ───

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
