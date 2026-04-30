-- ─── Table odontogrammes ───
-- Stocke l'odontogramme interactif par patient (1 par patient)

CREATE TABLE IF NOT EXISTS odontogrammes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_patient    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  id_etablissement UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
  id_praticien  UUID NOT NULL REFERENCES profils(id),
  data          JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),

  -- Un seul odontogramme par patient
  CONSTRAINT odontogrammes_unique_patient UNIQUE (id_patient)
);

-- Index pour recherche rapide par patient
CREATE INDEX IF NOT EXISTS idx_odontogrammes_patient ON odontogrammes(id_patient);
CREATE INDEX IF NOT EXISTS idx_odontogrammes_etablissement ON odontogrammes(id_etablissement);

-- RLS (Row Level Security)
ALTER TABLE odontogrammes ENABLE ROW LEVEL SECURITY;

-- Politique : les praticiens du même établissement peuvent lire/écrire
CREATE POLICY "Praticiens du même établissement"
  ON odontogrammes
  FOR ALL
  USING (
    id_etablissement IN (
      SELECT id_etablissement FROM profils WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    id_etablissement IN (
      SELECT id_etablissement FROM profils WHERE id = auth.uid()
    )
  );

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_odontogrammes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_odontogrammes_updated_at
  BEFORE UPDATE ON odontogrammes
  FOR EACH ROW
  EXECUTE FUNCTION update_odontogrammes_updated_at();
