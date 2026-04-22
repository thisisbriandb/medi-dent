'use client';

import { useAuth } from '@/contexts/AuthContext';
import type { Devise } from '@/lib/format';

export interface EtablissementInfo {
  id: string;
  nom: string;
  devise: Devise;
  tauxTva: number;
  logoUrl: string | null;
  modeActif: 'cabinet' | 'hopital';
}

/**
 * Hook qui extrait les infos établissement depuis le profil authentifié.
 * Réutilisable partout : factures, ordonnances, documents, etc.
 */
export function useEtablissement(): EtablissementInfo | null {
  const { profil } = useAuth();

  if (!profil?.etablissement) return null;

  const etab = profil.etablissement;

  return {
    id: etab.id,
    nom: etab.nom,
    devise: (etab.devise || 'XOF') as Devise,
    tauxTva: etab.taux_tva ?? 18,
    logoUrl: etab.logo_url ?? null,
    modeActif: etab.mode_actif ?? 'cabinet',
  };
}
