// ─── Helpers de formatage centralisés ───

export type Devise = 'XOF' | 'GNF' | string;

const DEVISE_LABELS: Record<string, { symbol: string; label: string }> = {
  XOF: { symbol: 'FCFA', label: 'Franc CFA' },
  GNF: { symbol: 'GNF', label: 'Franc Guinéen' },
  FCFA: { symbol: 'FCFA', label: 'Franc CFA' },
};

/**
 * Formate un montant avec la devise.
 * Ex: formatMoney(15000, 'XOF') → "15 000 FCFA"
 */
export function formatMoney(amount: number, devise: Devise = 'XOF'): string {
  const formatted = new Intl.NumberFormat('fr-FR').format(Math.round(amount));
  const info = DEVISE_LABELS[devise] || { symbol: devise, label: devise };
  return `${formatted} ${info.symbol}`;
}

/**
 * Formate une date longue.
 * Ex: formatDateLong('2026-04-22') → "22 avril 2026"
 */
export function formatDateLong(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Formate une date courte.
 * Ex: formatDate('2026-04-22') → "22/04/2026"
 */
export function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Formate une heure.
 * Ex: formatTime('2026-04-22T14:30:00') → "14:30"
 */
export function formatTime(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
