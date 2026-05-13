import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// ─── In-memory lock (remplace navigator.locks) ───
// navigator.locks peut bloquer indéfiniment après mise en veille / inactivité.
// On utilise une simple file d'attente par nom, sans coordination inter-onglets.
// Le pire cas (deux onglets refreshent en parallèle) est géré par Supabase.
const _locks = new Map<string, Promise<void>>();

function inMemoryLock<R>(
  name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> {
  const prev = _locks.get(name) ?? Promise.resolve();
  let release: () => void;
  const next = new Promise<void>((res) => { release = res; });
  _locks.set(name, next);

  return prev
    .catch(() => {})              // ignorer l'erreur du précédent
    .then(() => fn())             // exécuter la section critique
    .finally(() => {
      release!();
      if (_locks.get(name) === next) _locks.delete(name);
    });
}

// Singleton : un seul client navigateur pour éviter les conflits de lock
let _supabase: ReturnType<typeof createBrowserClient> | null = null;

export const supabase = (() => {
  if (!_supabase) {
    // Si les variables manquent, on log un warning au lieu de throw,
    // ce qui permet au build de passer même sans variables d'env.
    if (!supabaseUrl || !supabaseAnonKey) {
      if (typeof window !== 'undefined') {
        console.error('Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requises.');
      }
      
      // Pendant le build ou si variables manquantes, on crée un client avec des placeholders
      // pour éviter que l'importation de ce module ne fasse planter l'application.
      _supabase = createBrowserClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseAnonKey || 'placeholder'
      );
    } else {
      _supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          lock: <R>(name: string, acquireTimeout: number, fn: () => Promise<R>) =>
            inMemoryLock(name, acquireTimeout, fn),
        },
      });
    }
  }
  return _supabase;
})();
