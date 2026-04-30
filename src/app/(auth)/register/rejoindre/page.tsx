'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, KeyRound, User, Mail, Lock, Phone, Stethoscope, Check, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import InvitationService from '@/app/services/InvitationService';

const INPUT_CLS = 'block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm';

type Step = 1 | 2;

export default function RejoindreRegisterPage() {
  const { registerWithInvitation } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1 : Code + Compte
  const [code, setCode] = useState('');
  const [codeValidated, setCodeValidated] = useState(false);
  const [codeInfo, setCodeInfo] = useState<{ role: string; etablissement_nom: string; email_invite?: string | null } | null>(null);
  const [validating, setValidating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 : Profil
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [specialite, setSpecialite] = useState('');

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrateur',
    medecin_chef: 'Médecin chef',
    praticien: 'Praticien',
    infirmier: 'Infirmier(e)',
    comptable: 'Comptable',
    stagiaire: 'Stagiaire',
    secretaire: 'Secrétaire',
  };

  const handleValidateCode = async () => {
    setError(null);
    if (code.trim().length < 3) {
      setError('Veuillez saisir un code valide.');
      return;
    }
    setValidating(true);
    try {
      const result = await InvitationService.validate(code);
      if (!result.valid) {
        setError(result.error || 'Code invalide.');
        return;
      }
      setCodeValidated(true);
      setCodeInfo({
        role: result.role!,
        etablissement_nom: result.etablissement_nom!,
        email_invite: result.email_invite,
      });
      if (result.email_invite) {
        setEmail(result.email_invite);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de validation.');
    } finally {
      setValidating(false);
    }
  };

  const handleNext = () => {
    setError(null);
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setStep(2);
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
      await registerWithInvitation({
        email,
        password,
        nom,
        prenom,
        telephone: telephone || undefined,
        specialite: specialite || undefined,
        code_invitation: code,
      });
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { n: 1, label: 'Compte' },
    { n: 2, label: 'Profil' },
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
            <h1 className="text-2xl font-bold text-gray-900">Rejoindre un cabinet</h1>

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

          {/* ── Step 1 : Code + Compte ── */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Code d&apos;invitation</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><KeyRound className="h-4 w-4 text-gray-400" /></div>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeValidated(false); setCodeInfo(null); }}
                      placeholder="MD-XXXXX"
                      className={`${INPUT_CLS} font-mono tracking-wider uppercase`}
                      disabled={codeValidated}
                    />
                  </div>
                  {!codeValidated && (
                    <button type="button" onClick={handleValidateCode} disabled={validating || code.length < 3} className="px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors whitespace-nowrap">
                      {validating ? '...' : 'Vérifier'}
                    </button>
                  )}
                </div>
              </div>

              {/* Code validé — afficher les infos */}
              {codeValidated && codeInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-1">
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                    <Check className="w-4 h-4" />
                    Code valide
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span>{codeInfo.etablissement_nom}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Rôle attribué : <span className="font-medium">{ROLE_LABELS[codeInfo.role] || codeInfo.role}</span>
                  </div>
                </div>
              )}

              {codeValidated && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-gray-400" /></div>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" required disabled={!!codeInfo?.email_invite} className={INPUT_CLS} />
                    </div>
                    {codeInfo?.email_invite && (
                      <p className="text-xs text-gray-400 mt-1">Email fixé par l&apos;invitation</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-gray-400" /></div>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 caractères" required className={INPUT_CLS} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-gray-400" /></div>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={INPUT_CLS} />
                    </div>
                  </div>
                  <button type="button" onClick={handleNext} disabled={!email || !password || !confirmPassword} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors font-medium text-sm">
                    Suivant <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Step 2 : Profil ── */}
          {step === 2 && (
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
                  <input type="text" value={specialite} onChange={(e) => setSpecialite(e.target.value)} placeholder="Chirurgien-dentiste..." className={INPUT_CLS} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-gray-400" /></div>
                  <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+221 77 000 00 00" className={INPUT_CLS} />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Retour
                </button>
                <button type="submit" disabled={loading || !prenom || !nom} className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors font-medium text-sm">
                  {loading ? 'Inscription...' : 'Rejoindre le cabinet'}
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
          <Image src="/doctor-consultation.jpg" alt="MediDent Pro" fill priority className="object-cover" sizes="50vw" />
        </div>
        <div className="absolute inset-0 z-20 flex items-center justify-center p-12">
          <div className="max-w-xl text-center text-white">
            <h2 className="text-4xl font-bold mb-6">Rejoignez votre équipe</h2>
            <p className="text-xl opacity-90">Utilisez le code fourni par votre cabinet pour accéder à l&apos;espace commun.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
