require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { sendConfirmation, sendPaymentConfirmed } = require('./emails');

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://h4ac.ch',
    'http://127.0.0.1:5501',
    'http://localhost:5501'
  ].filter(Boolean)
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `H4AC-${code}`;
}

function validatePayload(body) {
  const { mode, capitaine, joueurs = [], remplacants = [], paymentMethod } = body || {};

  if (!['equipe', 'solo'].includes(mode)) return 'Mode invalide';
  if (!capitaine || typeof capitaine !== 'object') return 'Données capitaine manquantes';
  if (!['twint', 'iban'].includes(paymentMethod)) return 'Méthode de paiement invalide (twint ou iban)';

  const nameRx = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const checkPlayer = (p, label) => {
    if (!p || typeof p !== 'object') return `${label} — Données manquantes`;
    if (!nameRx.test(p.firstName)) return `${label} — Prénom invalide`;
    if (!nameRx.test(p.lastName)) return `${label} — Nom invalide`;
    if (!emailRx.test(p.email)) return `${label} — Email invalide`;
    if (!p.birth) return `${label} — Date de naissance manquante`;
    if (!['male', 'female', 'other'].includes(p.sexe)) return `${label} — Genre invalide`;
    if (!['S', 'M', 'L', 'XL', 'XXL'].includes(p.jerseySize)) return `${label} — Taille maillot invalide`;
    return null;
  };

  const capErr = checkPlayer(capitaine, 'Capitaine');
  if (capErr) return capErr;
  if (!capitaine.level) return 'Niveau de jeu requis';
  if (!capitaine.phone) return 'Téléphone du capitaine requis';

  if (mode === 'equipe') {
    if (!capitaine.TeamName) return "Nom d'équipe requis";
    if (joueurs.length !== 4) return '4 titulaires requis';
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

  const players = [toPlayer(capitaine, mode === 'solo' ? 'solo' : 'capitaine')];
  if (mode === 'equipe') {
    joueurs.forEach(j => players.push(toPlayer(j, 'titulaire')));
    remplacants.forEach(r => players.push(toPlayer(r, 'remplacant')));
  }
  return players;
}

// ─── POST /api/register ───────────────────────────────────────────────────────

app.post('/api/register', async (req, res) => {
  try {
    const { mode, capitaine, joueurs = [], remplacants = [], paymentMethod } = req.body || {};

    const validationError = validatePayload(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const totalAmount = mode === 'equipe' ? 100 : 15;
    const referenceCode = genReference();
    const players = buildPlayers(mode, capitaine, joueurs, remplacants);

    // Insertion principale via RPC
    const { data: regId, error: dbError } = await supabase.rpc('create_registration', {
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

    // Mise à jour payment_method et payment_status
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        payment_method: paymentMethod,
        payment_status: 'awaiting_manual',
      })
      .eq('reference_code', referenceCode);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      // Non bloquant : l'inscription est créée, on log juste l'erreur
    }

    // Envoi email de confirmation immédiat
    const registration = {
      reference_code: referenceCode,
      mode,
      team_name: capitaine.TeamName || null,
      total_amount: totalAmount,
      payment_method: paymentMethod,
    };

    sendConfirmation(registration, players).catch(err =>
      console.error('[email] Erreur envoi confirmation:', err)
    );

    console.log(`[register] ${referenceCode} — mode:${mode} paiement:${paymentMethod}`);

    return res.status(200).json({
      success: true,
      referenceCode,
      registrationId: regId,
    });

  } catch (err) {
    console.error('Erreur /api/register:', err);
    return res.status(500).json({ error: 'Erreur serveur inattendue' });
  }
});

// ─── GET /api/registration/:ref ───────────────────────────────────────────────

app.get('/api/registration/:ref', async (req, res) => {
  const { ref } = req.params;
  const { data, error } = await supabase
    .from('registrations')
    .select('id, reference_code, mode, team_name, total_amount, payment_status, payment_method, created_at')
    .eq('reference_code', ref)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Inscription introuvable' });
  return res.status(200).json(data);
});

// ─── POST /api/admin/resend/:ref ──────────────────────────────────────────────
app.post('/api/admin/resend/:ref', async (req, res) => {
  const secret = req.headers['x-admin-key'];
  if (!secret || secret !== process.env.ADMIN_SECRET)
    return res.status(401).json({ error: 'Non autorisé' });

  const { ref } = req.params;

  const { data: reg, error: fetchError } = await supabase
    .from('registrations')
    .select('*')
    .eq('reference_code', ref)
    .single();

  if (fetchError || !reg) return res.status(404).json({ error: 'Inscription introuvable' });

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*')
    .eq('registration_id', reg.id);

  if (playersError || !players) return res.status(500).json({ error: 'Erreur récupération joueurs' });

  await sendConfirmation(reg, players);

  console.log(`[admin] Resend ${ref} → ${players.map(p => p.email).join(', ')}`);
  return res.status(200).json({ success: true, sent_to: players.map(p => p.email) });
});

// ─── POST /api/admin/mark-paid/:ref ───────────────────────────────────────────

app.post('/api/admin/mark-paid/:ref', async (req, res) => {
  const secret = req.headers['x-admin-key'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const { ref } = req.params;

  console.log('HEADER:', req.headers['x-admin-key']);
  console.log('ENV:', process.env.ADMIN_SECRET);

  const { data: reg, error: fetchError } = await supabase
    .from('registrations')
    .select('id, reference_code, mode, team_name, total_amount, payment_status, captain_email')
    .eq('reference_code', ref)
    .single();

  if (fetchError || !reg) return res.status(404).json({ error: 'Inscription introuvable' });
  if (reg.payment_status === 'paid') return res.status(409).json({ error: 'Déjà marqué comme payé' });

  const { error: updateError } = await supabase
    .from('registrations')
    .update({ payment_status: 'paid' })
    .eq('reference_code', ref);

  if (updateError) {
    console.error('Erreur mark-paid:', updateError);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }

  const { data: capPlayer } = await supabase
    .from('players')
    .select('first_name')
    .eq('registration_id', reg.id)
    .in('role', ['capitaine', 'solo'])
    .single();

  const registration = {
    ...reg,
    captain_first_name: capPlayer?.first_name || null,
  };

  sendPaymentConfirmed(registration).catch(err =>
    console.error('[email] Erreur email paiement confirmé:', err)
  );

  console.log(`[admin] ${ref} marqué paid — email envoyé à ${reg.captain_email}`);
  return res.status(200).json({ success: true, reference_code: ref, email_sent_to: reg.captain_email });
});

// ─── GET /api/admin/registrations ────────────────────────────────────────────
app.get('/api/admin/registrations', async (req, res) => {
  const secret = req.headers['x-admin-key'];
  if (!secret || secret !== process.env.ADMIN_SECRET)
    return res.status(401).json({ error: 'Non autorisé' });

  const { data, error } = await supabase
    .from('registrations')
    .select('id,reference_code,mode,team_name,total_amount,payment_status,payment_method,captain_email,created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
});

// ─── GET /api/admin/players ───────────────────────────────────────────────────
app.get('/api/admin/players', async (req, res) => {
  const secret = req.headers['x-admin-key'];
  if (!secret || secret !== process.env.ADMIN_SECRET)
    return res.status(401).json({ error: 'Non autorisé' });

  const { data, error } = await supabase
    .from('players')
    .select('id,registration_id,first_name,last_name,email,role,sexe,birth,level,jersey_size,contest_3pts,contest_dunk,phone')
    .order('id', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
});

app.get('/', (req, res) => res.json({ message: '🏀 H4AC API works' }));

app.listen(PORT, () => console.log(`🏀 H4AC Backend démarré sur http://localhost:${PORT}`));