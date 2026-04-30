'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Building2, User, Mail, Lock, Phone, Stethoscope, MapPin, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const INPUT_CLS = 'block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm';

type Step = 1 | 2 | 3;

export default function EtablissementRegisterPage() {
  const { registerWithEtablissement } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1 : Compte
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 : Établissement
  const [etabNom, setEtabNom] = useState('');
  const [etabAdresse, setEtabAdresse] = useState('');
  const [etabTelephone, setEtabTelephone] = useState('');
  const [etabMode, setEtabMode] = useState<'cabinet' | 'hopital'>('cabinet');

  // Step 3 : Profil
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [specialite, setSpecialite] = useState('');

  const canNextStep1 = email && password && confirmPassword && password === confirmPassword;
  const canNextStep2 = etabNom.trim().length > 0;

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
      if (password.length < 6) {
        setError('Le mot de passe doit faire au moins 6 caractères.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!prenom || !nom) {
      setError('Prénom et nom sont requis.');
      return;
    }
    setLoading(true);
    try {
      await registerWithEtablissement({
        email,
        password,
        nom,
        prenom,
        telephone: telephone || undefined,
        specialite: specialite || undefined,
        etablissement: {
          nom: etabNom,
          adresse: etabAdresse || undefined,
          telephone: etabTelephone || undefined,
          mode_actif: etabMode,
        },
      });
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { n: 1, label: 'Compte' },
    { n: 2, label: 'Cabinet' },
    { n: 3, label: 'Profil' },
  ];

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Formulaire */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-6">
          <div>
            <Link href="/register" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Retour
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Créer mon cabinet</h1>

            {/* Stepper */}
            <div className="flex items-center gap-2 mt-4">
              {steps.map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step > s.n ? 'bg-blue-500 text-white' : step === s.n ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s.n ? <Check className="w-3.5 h-3.5" /> : s.n}
                  </div>
                  <span className={`text-xs ${step >= s.n ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{s.label}</span>
                  {i < steps.length - 1 && <div className="w-8 h-px bg-gray-200" />}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">{error}</div>
          )}

          {/* ── Step 1 : Compte ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-gray-400" /></div>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" required className={INPUT_CLS} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-gray-400" /></div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 caractères" required className={INPUT_CLS} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-gray-400" /></div>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={INPUT_CLS} />
                </div>
              </div>
              <button type="button" onClick={handleNext} disabled={!canNextStep1} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors font-medium text-sm">
                Suivant <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 2 : Établissement ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du cabinet / clinique *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building2 className="h-4 w-4 text-gray-400" /></div>
                  <input type="text" value={etabNom} onChange={(e) => setEtabNom(e.target.value)} placeholder="Cabinet Dentaire du Centre" required className={INPUT_CLS} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin className="h-4 w-4 text-gray-400" /></div>
                  <input type="text" value={etabAdresse} onChange={(e) => setEtabAdresse(e.target.value)} placeholder="Rue, Ville" className={INPUT_CLS} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone du cabinet</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-gray-400" /></div>
                  <input type="tel" value={etabTelephone} onChange={(e) => setEtabTelephone(e.target.value)} placeholder="+221 77 000 00 00" className={INPUT_CLS} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type d&apos;établissement</label>
                <div className="flex gap-3">
                  {(['cabinet', 'hopital'] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setEtabMode(m)} className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all ${etabMode === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {m === 'cabinet' ? 'Cabinet' : 'Hôpital / Clinique'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={handleBack} className="px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Retour
                </button>
                <button type="button" onClick={handleNext} disabled={!canNextStep2} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors font-medium text-sm">
                  Suivant <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3 : Profil ── */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-gray-400" /></div>
                    <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Marie" required className={INPUT_CLS} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-gray-400" /></div>
                    <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Diallo" required className={INPUT_CLS} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Spécialité</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Stethoscope className="h-4 w-4 text-gray-400" /></div>
                  <input type="text" value={specialite} onChange={(e) => setSpecialite(e.target.value)} placeholder="Chirurgien-dentiste, Orthodontiste..." className={INPUT_CLS} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone personnel</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-gray-400" /></div>
                  <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+221 77 000 00 00" className={INPUT_CLS} />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={handleBack} className="px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Retour
                </button>
                <button type="submit" disabled={loading || !prenom || !nom} className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors font-medium text-sm">
                  {loading ? 'Création en cours...' : 'Créer mon cabinet'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500">
            Déjà inscrit ?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">Se connecter</Link>
          </p>
        </div>
      </div>

      {/* Visuel */}
      <div className="hidden lg:block relative bg-gradient-to-br from-blue-500 to-blue-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20 z-10" />
        <div className="absolute inset-0">
          <Image src="/doctor_consultation.png" alt="MediDent Pro" fill priority className="object-cover" sizes="50vw" />
        </div>
        <div className="absolute inset-0 z-20 flex items-center justify-center p-12">
          <div className="max-w-xl text-center text-white">
            <h2 className="text-4xl font-bold mb-6">Gérez votre cabinet en toute simplicité</h2>
            <p className="text-xl opacity-90">Patients, consultations, facturation et ordonnances — tout-en-un.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
