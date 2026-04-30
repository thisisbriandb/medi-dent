-- Table des invitations pour rejoindre un établissement
-- Un medecin_chef génère un code, le transmet à un collègue qui l'utilise à l'inscription

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_etablissement UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
  code VARCHAR(8) NOT NULL UNIQUE,
  role VARCHAR(30) NOT NULL DEFAULT 'praticien',
  email_invite VARCHAR(255) DEFAULT NULL,
  utilise BOOLEAN NOT NULL DEFAULT false,
  id_utilise_par UUID REFERENCES profils(id) DEFAULT NULL,
  expire_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES profils(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_code ON invitations(code);
CREATE INDEX idx_invitations_etablissement ON invitations(id_etablissement);

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Les membres de l'établissement peuvent voir les invitations
CREATE POLICY "Membres peuvent voir invitations" ON invitations
  FOR SELECT USING (
    id_etablissement IN (
      SELECT id_etablissement FROM profils WHERE id = auth.uid()
    )
  );

-- Seuls medecin_chef / admin peuvent créer des invitations
CREATE POLICY "Admin/chef peuvent créer invitations" ON invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profils
      WHERE id = auth.uid()
        AND id_etablissement = invitations.id_etablissement
        AND role IN ('admin', 'medecin_chef')
    )
  );

-- Les invitations peuvent être mises à jour (marquées utilisées) par quiconque les consomme
CREATE POLICY "Consommer invitation" ON invitations
  FOR UPDATE USING (utilise = false);
