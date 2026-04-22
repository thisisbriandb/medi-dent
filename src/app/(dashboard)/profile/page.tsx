'use client';

import { useState, useRef } from 'react';
import {
  User,
  Building2,
  Camera,
  Save,
  Mail,
  Phone,
  Stethoscope,
  Shield,
  Globe,
  Percent,
  Palette,
  Lock,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEtablissement } from '@/hooks/useEtablissement';
import AuthService from '@/app/services/AuthService';

type TabKey = 'praticien' | 'etablissement' | 'securite';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'praticien', label: 'Mon profil', icon: <User className="w-4 h-4" /> },
  { key: 'etablissement', label: 'Établissement', icon: <Building2 className="w-4 h-4" /> },
  { key: 'securite', label: 'Sécurité', icon: <Shield className="w-4 h-4" /> },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  medecin_chef: 'Médecin chef',
  praticien: 'Praticien',
  infirmier: 'Infirmier',
  comptable: 'Comptable',
  stagiaire: 'Stagiaire',
  secretaire: 'Secrétaire',
};

const DEVISES = [
  { value: 'XOF', label: 'FCFA (XOF)' },
  { value: 'GNF', label: 'Franc Guinéen (GNF)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'USD', label: 'Dollar US (USD)' },
];

export default function ProfilePage() {
  const { profil, refreshProfil } = useAuth();
  const etab = useEtablissement();
  const [activeTab, setActiveTab] = useState<TabKey>('praticien');

  if (!profil) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  const initials = `${profil.prenom?.[0] || ''}${profil.nom?.[0] || ''}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden">
              {profil.photo_url ? (
                <img src={profil.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-blue-600">{initials}</span>
              )}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dr. {profil.prenom} {profil.nom}</h1>
            <p className="text-sm text-gray-500">{ROLE_LABELS[profil.role] || profil.role} {profil.specialite && `— ${profil.specialite}`}</p>
            <p className="text-sm text-gray-400 mt-0.5">{etab?.nom || 'Aucun établissement'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
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

        <div className="p-6">
          {activeTab === 'praticien' && <TabPraticien profil={profil} onSaved={refreshProfil} />}
          {activeTab === 'etablissement' && <TabEtablissement profil={profil} onSaved={refreshProfil} />}
          {activeTab === 'securite' && <TabSecurite />}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: Praticien
// ═══════════════════════════════════════════

function TabPraticien({ profil, onSaved }: { profil: NonNullable<ReturnType<typeof useAuth>['profil']>; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({
    nom: profil.nom || '',
    prenom: profil.prenom || '',
    telephone: profil.telephone || '',
    specialite: profil.specialite || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await AuthService.updateProfil(profil.id, {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone || null,
        specialite: form.specialite || null,
      } as any);
      await onSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await AuthService.uploadPhoto(profil.id, file);
      await onSaved();
    } catch (err: any) {
      setError(err.message || 'Erreur upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const initials = `${profil.prenom?.[0] || ''}${profil.nom?.[0] || ''}`.toUpperCase();

  return (
    <div className="space-y-8">
      {/* Photo */}
      <div>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Photo de profil</h3>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden">
              {profil.photo_url ? (
                <img src={profil.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-blue-600">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
          <div>
            <p className="text-sm text-gray-700">Changer la photo</p>
            <p className="text-xs text-gray-400">JPG, PNG. Max 2 Mo.</p>
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Informations personnelles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Prénom" icon={<User className="w-4 h-4" />} value={form.prenom} onChange={(v) => setForm(f => ({ ...f, prenom: v }))} />
          <Field label="Nom" icon={<User className="w-4 h-4" />} value={form.nom} onChange={(v) => setForm(f => ({ ...f, nom: v }))} />
          <Field label="Téléphone" icon={<Phone className="w-4 h-4" />} value={form.telephone} onChange={(v) => setForm(f => ({ ...f, telephone: v }))} placeholder="+224 6XX XXX XXX" />
          <Field label="Spécialité" icon={<Stethoscope className="w-4 h-4" />} value={form.specialite} onChange={(v) => setForm(f => ({ ...f, specialite: v }))} placeholder="Chirurgie dentaire" />
        </div>
      </div>

      {/* Read-only fields */}
      <div>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Informations du compte</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyField label="Email" value={profil.email} icon={<Mail className="w-4 h-4" />} />
          <ReadOnlyField label="Rôle" value={ROLE_LABELS[profil.role] || profil.role} icon={<Shield className="w-4 h-4" />} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: Établissement
// ═══════════════════════════════════════════

function TabEtablissement({ profil, onSaved }: { profil: NonNullable<ReturnType<typeof useAuth>['profil']>; onSaved: () => Promise<void> }) {
  const etab = profil.etablissement;

  const [form, setForm] = useState({
    nom: etab?.nom || '',
    devise: etab?.devise || 'XOF',
    taux_tva: String(etab?.taux_tva ?? 18),
    mode_actif: etab?.mode_actif || 'cabinet',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!etab) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p className="text-sm text-gray-400">Aucun établissement associé à votre profil.</p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await AuthService.updateEtablissement(etab.id, {
        nom: form.nom,
        devise: form.devise,
        taux_tva: parseFloat(form.taux_tva) || 0,
        mode_actif: form.mode_actif,
      });
      await onSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Informations de l'établissement</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom de l'établissement" icon={<Building2 className="w-4 h-4" />} value={form.nom} onChange={(v) => setForm(f => ({ ...f, nom: v }))} />
          <SelectField
            label="Mode"
            icon={<Palette className="w-4 h-4" />}
            value={form.mode_actif}
            onChange={(v) => setForm(f => ({ ...f, mode_actif: v as 'cabinet' | 'hopital' }))}
            options={[
              { value: 'cabinet', label: 'Cabinet Dentaire' },
              { value: 'hopital', label: 'Hôpital / Clinique' },
            ]}
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Paramètres financiers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Devise"
            icon={<Globe className="w-4 h-4" />}
            value={form.devise}
            onChange={(v) => setForm(f => ({ ...f, devise: v }))}
            options={DEVISES}
          />
          <Field
            label="Taux de TVA (%)"
            icon={<Percent className="w-4 h-4" />}
            value={form.taux_tva}
            onChange={(v) => setForm(f => ({ ...f, taux_tva: v }))}
            type="number"
            placeholder="18"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: Sécurité
// ═══════════════════════════════════════════

function TabSecurite() {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setError(null);
    if (newPwd.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (newPwd !== confirmPwd) { setError('Les mots de passe ne correspondent pas.'); return; }
    setSaving(true);
    try {
      await AuthService.updatePassword(newPwd);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setSaving(false);
    }
  };

  const EyeIcon = showPwd ? EyeOff : Eye;

  return (
    <div className="space-y-6 max-w-md">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Changer le mot de passe</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPwd ? 'text' : 'password'}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPwd ? 'text' : 'password'}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

      <button
        onClick={handleChangePassword}
        disabled={saving || !newPwd}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saved ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        {saving ? 'Enregistrement…' : saved ? 'Mot de passe modifié' : 'Changer le mot de passe'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════
// Shared form components
// ═══════════════════════════════════════════

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <div className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-100 rounded-lg bg-gray-100 text-gray-500">
          {value}
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label,
  icon,
  value,
  onChange,
  options,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}