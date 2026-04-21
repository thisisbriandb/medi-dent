// ─── Supabase Client ───
// Ce fichier ré-exporte le client Supabase pour compatibilité
// avec les anciens services qui importent depuis './api'.
// Les anciens services (DashboardService, PatientService, etc.)
// seront migrés progressivement pour utiliser directement supabase.

export { supabase as api } from '@/lib/supabase';
export { supabase } from '@/lib/supabase'; 
