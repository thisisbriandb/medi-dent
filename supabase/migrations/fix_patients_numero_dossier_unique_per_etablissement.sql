-- Aligner la contrainte d'unicite avec la logique metier:
-- numero_dossier doit etre unique par etablissement, pas globalement.

ALTER TABLE public.patients
DROP CONSTRAINT IF EXISTS patients_numero_dossier_key;

ALTER TABLE public.patients
ADD CONSTRAINT patients_id_etablissement_numero_dossier_key
UNIQUE (id_etablissement, numero_dossier);
