'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEtablissement } from '@/hooks/useEtablissement';
import InvitationService, { type Invitation } from '@/app/services/InvitationService';
import { supabase } from '@/lib/supabase';
import { Plus, Copy, Check, Trash2, Users, UserPlus, Clock, Shield } from 'lucide-react';
import type { Profil } from '@/app/services/AuthService';

const ROLE_OPTIONS = [
  { value: 'praticien', label: 'Praticien' },
  { value: 'secretaire', label: 'Secrétaire' },
  { value: 'comptable', label: 'Comptable' },
  { value: 'infirmier', label: 'Infirmier(e)' },
  { value: 'stagiaire', label: 'Stagiaire' },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  medecin_chef: 'Médecin chef',
  praticien: 'Praticien',
  infirmier: 'Infirmier(e)',
  comptable: 'Comptable',
  stagiaire: 'Stagiaire',
  secretaire: 'Secrétaire',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  medecin_chef: 'bg-blue-100 text-blue-700',
  praticien: 'bg-emerald-100 text-emerald-700',
  infirmier: 'bg-cyan-100 text-cyan-700',
  comptable: 'bg-amber-100 text-amber-700',
  stagiaire: 'bg-gray-100 text-gray-600',
  secretaire: 'bg-pink-100 text-pink-700',
};

export default function EquipePage() {
  const { profil } = useAuth();
  const etab = useEtablissement();
  const isAdmin = profil?.role === 'medecin_chef' || profil?.role === 'admin';

  const [members, setMembers] = useState<Profil[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // New invitation form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteRole, setInviteRole] = useState('praticien');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDays, setInviteDays] = useState(7);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!etab?.id) return;
    setLoadingMembers(true);
    try {
      const [{ data: membersData }, invData] = await Promise.all([
        supabase.from('profils').select('*').eq('id_etablissement', etab.id).order('role').order('nom'),
        InvitationService.getByEtablissement(etab.id),
      ]);
      setMembers((membersData ?? []) as unknown as Profil[]);
      setInvitations(invData);
    } catch (err) {
      console.error('Erreur chargement équipe:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, [etab?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateInvitation = async () => {
    if (!etab?.id) return;
    setCreating(true);
    try {
      await InvitationService.create({
        id_etablissement: etab.id,
        role: inviteRole,
        email_invite: inviteEmail || undefined,
        expire_days: inviteDays,
      });
      setShowInviteForm(false);
      setInviteEmail('');
      loadData();
    } catch (err: any) {
      console.error('Erreur création invitation:', err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRevoke = async (id: string) => {
    try {
      await InvitationService.revoke(id);
      loadData();
    } catch (err: any) {
      console.error('Erreur suppression:', err.message);
    }
  };

  const activeInvitations = invitations.filter((i) => !i.utilise && new Date(i.expire_at) > new Date());
  const usedInvitations = invitations.filter((i) => i.utilise);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Équipe</h1>
          <p className="text-sm text-gray-500 mt-1">
            {members.length} membre{members.length > 1 ? 's' : ''} — {etab?.nom}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Inviter
          </button>
        )}
      </div>

      {/* Invitation form */}
      {showInviteForm && isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Nouvelle invitation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (optionnel)</label>
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Restreindre à cet email" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expire dans</label>
              <select value={inviteDays} onChange={(e) => setInviteDays(Number(e.target.value))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value={3}>3 jours</option>
                <option value={7}>7 jours</option>
                <option value={14}>14 jours</option>
                <option value={30}>30 jours</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowInviteForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
            <button onClick={handleCreateInvitation} disabled={creating} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
              {creating ? 'Création...' : 'Générer le code'}
            </button>
          </div>
        </div>
      )}

      {/* Active invitations */}
      {isAdmin && activeInvitations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Invitations en cours</h2>
          <div className="space-y-3">
            {activeInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-gray-800 bg-white px-3 py-1 rounded border border-gray-200">{inv.code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[inv.role] || 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABELS[inv.role] || inv.role}
                  </span>
                  {inv.email_invite && <span className="text-xs text-gray-400">{inv.email_invite}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(inv.expire_at).toLocaleDateString('fr-FR')}
                  </span>
                  <button onClick={() => handleCopyCode(inv.code)} className="p-1.5 hover:bg-gray-200 rounded transition-colors" title="Copier le code">
                    {copiedCode === inv.code ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                  </button>
                  <button onClick={() => handleRevoke(inv.id)} className="p-1.5 hover:bg-red-50 rounded transition-colors" title="Révoquer">
                    <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" />
            Membres
          </h2>
        </div>
        {loadingMembers ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Membre</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Rôle</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Contact</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">{m.prenom?.[0]}{m.nom?.[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.prenom} {m.nom}</p>
                        {m.specialite && <p className="text-xs text-gray-400">{m.specialite}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[m.role] || 'bg-gray-100 text-gray-600'}`}>
                      {m.role === 'medecin_chef' && <Shield className="w-3 h-3" />}
                      {ROLE_LABELS[m.role] || m.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <p className="text-sm text-gray-600">{m.email}</p>
                    {m.telephone && <p className="text-xs text-gray-400">{m.telephone}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${m.est_actif ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {m.est_actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
