require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const { sendConfirmation } = require('./emails');

// ─── Supabase client ──────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return `H4AC-${code}`;
}

function validatePayload(body) {
  const { mode, capitaine, joueurs = [], remplacants = [] } = body || {};

  if (!['equipe', 'solo'].includes(mode)) {
    return 'Mode invalide';
  }

  if (!capitaine || typeof capitaine !== 'object') {
    return 'Données capitaine manquantes';
  }

  const nameRx = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const checkPlayer = (p, label) => {
    if (!p || typeof p !== 'object')
      return `${label} — Données manquantes`;

    if (!nameRx.test(p.firstName))
      return `${label} — Prénom invalide`;

    if (!nameRx.test(p.lastName))
      return `${label} — Nom invalide`;

    if (!emailRx.test(p.email))
      return `${label} — Email invalide`;

    if (!p.birth)
      return `${label} — Date de naissance manquante`;

    if (!['male', 'female', 'other'].includes(p.sexe))
      return `${label} — Genre invalide`;

    if (!['S', 'M', 'L', 'XL', 'XXL'].includes(p.jerseySize))
      return `${label} — Taille maillot invalide`;

    return null;
  };

  const capErr = checkPlayer(capitaine, 'Capitaine');

  if (capErr) return capErr;

  if (!capitaine.level)
    return 'Niveau de jeu requis';

  if (!capitaine.phone)
    return 'Téléphone du capitaine requis';

  if (mode === 'equipe') {

    if (!capitaine.TeamName)
      return "Nom d'équipe requis";

    if (joueurs.length !== 4)
      return '4 titulaires requis';

    for (let i = 0; i < joueurs.length; i++) {
      const err = checkPlayer(joueurs[i], `Titulaire ${i + 1}`);

      if (err) return err;
    }

    for (let i = 0; i < remplacants.length; i++) {
      const err = checkPlayer(remplacants[i], `Remplaçant ${i + 1}`);

      if (err) return err;
    }
  }

  return null;
}

function buildPlayers(mode, capitaine, joueurs, remplacants) {

  const toPlayer = (p, role) => ({
    role,

    first_name: p.firstName,
    last_name: p.lastName,

    email: p.email.toLowerCase().trim(),

    phone: p.phone || null,

    birth: p.birth,
    sexe: p.sexe,

    level: p.level || null,

    jersey_size: p.jerseySize,

    contest_3pts: !!p.contest3pts,
    contest_dunk: !!p.contestDunk,
  });

  const players = [
    toPlayer(
      capitaine,
      mode === 'solo' ? 'solo' : 'capitaine'
    )
  ];

  if (mode === 'equipe') {

    joueurs.forEach(j =>
      players.push(toPlayer(j, 'titulaire'))
    );

    remplacants.forEach(r =>
      players.push(toPlayer(r, 'remplacant'))
    );
  }

  return players;
}

// ─── POST /api/register ───────────────────────────────────────────────────────

app.post('/api/register', async (req, res) => {

  try {

    const {
      mode,
      capitaine,
      joueurs = [],
      remplacants = []
    } = req.body || {};

    // 1. Validation
    const validationError = validatePayload(req.body);

    if (validationError) {
      return res.status(400).json({
        error: validationError
      });
    }

    // 2. Préparation données
    const totalAmount = mode === 'equipe' ? 100 : 15;
    const referenceCode = genReference();
    const players = buildPlayers(mode, capitaine, joueurs, remplacants);

    // 3. Insertion Supabase
    const { data: regId, error: dbError } =
      await supabase.rpc('create_registration', {
        p_reference_code: referenceCode,
        p_mode: mode,
        p_team_name: capitaine.TeamName || null,
        p_captain_email: capitaine.email.toLowerCase().trim(),
        p_total_amount: totalAmount,
        p_players: players,
      });

    if (dbError) {
      console.error('Supabase RPC error:', dbError);
      return res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }

    // 4. Envoi email de confirmation
    //    DÉCOMMENTE quand tu veux envoyer l'email à l'inscription.
    //    Idéalement, à déplacer dans le webhook Stripe une fois branché.
    //
    // const registration = {
    //   reference_code: referenceCode,
    //   mode,
    //   team_name: capitaine.TeamName || null,
    //   total_amount: totalAmount,
    // };
    // sendConfirmation(registration, players).catch(err =>
    //   console.error('Erreur envoi email:', err)
    // );

    return res.status(200).json({
      success: true,
      message: 'Inscription enregistrée avec succès',
      referenceCode,
      registrationId: regId,
    });

  } catch (err) {
    console.error('Erreur /api/register:', err);
    return res.status(500).json({ error: 'Erreur serveur inattendue' });
  }
});

// ─── GET registration ─────────────────────────────────────────────────────────

app.get('/api/registration/:ref', async (req, res) => {

  const { ref } = req.params;

  const { data, error } = await supabase
    .from('registrations')
    .select(`
      id,
      reference_code,
      mode,
      team_name,
      total_amount,
      payment_status,
      created_at
    `)
    .eq('reference_code', ref)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Inscription introuvable' });
  }

  return res.status(200).json(data);
});

// ─── POST /api/test-email ─────────────────────────────────────────────────────
// Route de test pour envoyer un email de confirmation sans passer par
// une vraie inscription. Utile pour itérer sur le design.
//
// Body : { to: "ton@email.ch", mode: "equipe" | "solo" }

app.post('/api/test-email', async (req, res) => {

  const { to, mode = 'equipe' } = req.body || {};

  if (!to) {
    return res.status(400).json({ error: 'Champ "to" requis' });
  }

  // Données factices pour le test
  const registration = {
    reference_code: 'H4AC-TEST01',
    mode,
    team_name: mode === 'equipe' ? 'Plan-les-Bouchers' : null,
    total_amount: mode === 'equipe' ? 100 : 15,
  };

  const players = mode === 'equipe'
    ? [
        { first_name: 'Sam', last_name: 'Test', email: to, role: 'capitaine' },
        // Décommente pour tester aussi les variantes titulaire et remplacant
        // { first_name: 'Alex', last_name: 'Demo', email: to, role: 'titulaire' },
        // { first_name: 'Jo',   last_name: 'Demo', email: to, role: 'remplacant' },
      ]
    : [
        { first_name: 'Sam', last_name: 'Test', email: to, role: 'solo' },
      ];

  try {
    const result = await sendConfirmation(registration, players);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('Erreur test-email:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Route test ───────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ message: 'H4AC API works' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🏀 H4AC Backend démarré sur http://localhost:${PORT}`);
});