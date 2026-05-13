import { supabase, getValidSession } from '@/lib/supabase';
import type { Odontogramme, OdontogrammeData } from '@/types/odontogramme.types';

// ─── Helpers ───

async function getUserInfo(): Promise<{ userId: string; idEtablissement: string } | null> {
  const session = await getValidSession();
  if (!session?.user) return null;

  const { data } = await supabase
    .from('profils')
    .select('id_etablissement')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!data?.id_etablissement) return null;
  return { userId: session.user.id, idEtablissement: data.id_etablissement };
}

// ─── Service ───

const OdontogrammeService = {
  /**
   * Get the current odontogramme for a patient.
   * Returns null if none exists yet.
   */
  async getByPatient(idPatient: string): Promise<Odontogramme | null> {
    const { data, error } = await supabase
      .from('odontogrammes')
      .select('*')
      .eq('id_patient', idPatient)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erreur chargement odontogramme:', error);
      return null;
    }

    return data as Odontogramme | null;
  },

  /**
   * Create or update the odontogramme for a patient.
   * Uses upsert on id_patient (one odontogramme per patient).
   */
  async save(
    idPatient: string,
    odontogrammeData: OdontogrammeData,
    notes: string | null
  ): Promise<Odontogramme | null> {
    const userInfo = await getUserInfo();
    if (!userInfo) throw new Error('Utilisateur non authentifié');

    // Check if one already exists
    const existing = await this.getByPatient(idPatient);

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('odontogrammes')
        .update({
          data: odontogrammeData,
          notes,
          id_praticien: userInfo.userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour odontogramme:', error);
        throw new Error('Impossible de sauvegarder l\'odontogramme');
      }

      return data as Odontogramme;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('odontogrammes')
        .insert({
          id_patient: idPatient,
          id_etablissement: userInfo.idEtablissement,
          id_praticien: userInfo.userId,
          data: odontogrammeData,
          notes,
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur création odontogramme:', error);
        throw new Error('Impossible de créer l\'odontogramme');
      }

      return data as Odontogramme;
    }
  },
};

export default OdontogrammeService;
