import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
      _supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
  }
  return _supabase;
})();
