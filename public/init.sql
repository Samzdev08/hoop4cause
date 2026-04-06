-- Inscription principale (1 ligne par inscription)
CREATE TABLE registrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode            TEXT NOT NULL CHECK (mode IN ('team', 'solo')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  stripe_session_id TEXT UNIQUE,
  amount_chf      NUMERIC(10,2),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Équipe (uniquement si mode = 'team')
CREATE TABLE teams (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id     UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  contact_first_name  TEXT NOT NULL,
  contact_last_name   TEXT NOT NULL,
  contact_email       TEXT NOT NULL,
  contact_phone       TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Joueurs (5+ par équipe, ou 1 en mode solo)
CREATE TABLE players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  birth_date      DATE,
  gender          TEXT CHECK (gender IN ('M', 'F', 'X')),
  jersey_size     TEXT CHECK (jersey_size IN ('XS', 'S', 'M', 'L', 'XL')),
  is_captain      BOOLEAN DEFAULT FALSE,
  is_replacement  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sécurité : tout le monde peut soumettre, seul l'admin peut lire
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams         ENABLE ROW LEVEL SECURITY;
ALTER TABLE players       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_insert_reg"  ON registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_team" ON teams         FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_play" ON players       FOR INSERT WITH CHECK (true);