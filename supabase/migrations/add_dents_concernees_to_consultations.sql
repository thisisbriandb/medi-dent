-- Ajouter la colonne dents_concernees à la table consultations
-- Stocke un tableau de numéros FDI (ex: ["18", "36", "47"])

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS dents_concernees JSONB DEFAULT NULL;

COMMENT ON COLUMN consultations.dents_concernees IS 'Tableau JSON des numéros FDI des dents concernées par la consultation';
