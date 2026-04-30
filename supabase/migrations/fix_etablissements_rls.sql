-- Permettre à un utilisateur authentifié de créer un établissement (onboarding)
-- Ceci est nécessaire car lors de l'inscription, l'utilisateur n'a pas encore de profil

-- Policy INSERT : tout utilisateur authentifié peut créer un établissement
CREATE POLICY "Utilisateur authentifié peut créer un établissement"
  ON etablissements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy SELECT : un utilisateur peut voir son propre établissement
-- (via la table profils)
CREATE POLICY "Membre peut voir son établissement"
  ON etablissements
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT id_etablissement FROM profils WHERE id = auth.uid()
    )
  );

-- Policy UPDATE : seul admin/medecin_chef peut modifier l'établissement
CREATE POLICY "Admin peut modifier son établissement"
  ON etablissements
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT id_etablissement FROM profils 
      WHERE id = auth.uid() 
        AND role IN ('admin', 'medecin_chef')
    )
  );

-- ─── Fix RLS profils ───

-- Permettre à un utilisateur authentifié de créer son propre profil (onboarding)
CREATE POLICY "Utilisateur peut créer son propre profil"
  ON profils
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
