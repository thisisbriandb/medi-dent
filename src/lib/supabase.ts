import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lock avec timeout pour éviter que navigator.locks bloque indéfiniment
// lors du refresh de token après une longue inactivité / mise en veille
const LOCK_TIMEOUT = 5000;

function lockWithTimeout<R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    // Pas de navigator.locks (SSR / vieux navigateur) → exécuter directement
    return fn();
  }

  return new Promise<R>((resolve, reject) => {
    const ac = new AbortController();

    const timer = setTimeout(() => {
      // Annuler la requête de lock en attente
      ac.abort();
      // Exécuter sans lock plutôt que bloquer
      console.warn(`[supabase] Lock "${name}" timeout after ${acquireTimeout}ms, proceeding without lock`);
      fn().then(resolve).catch(reject);
    }, acquireTimeout);

    navigator.locks
      .request(name, { signal: ac.signal }, async () => {
        clearTimeout(timer);
        return fn();
      })
      .then(resolve)
      .catch((err) => {
        clearTimeout(timer);
        // Ignorer l'erreur d'abort (le timeout a déjà pris le relais)
        if (err?.name === 'AbortError') return;
        reject(err);
      });
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
          lock: <R>(name: string, _acquireTimeout: number, fn: () => Promise<R>) =>
            lockWithTimeout(name, LOCK_TIMEOUT, fn),
        },
      });
    }
  }
  return _supabase;
})();
