const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Hoop 4 A Cause <onboarding@resend.dev>';
const ADMIN_EMAIL = 'samtidokz@gmail.com';

// ─── Couleurs H4AC ────────────────────────────────────────────────────────────
const C = {
  bg: '#1A0A3D',
  card: '#2D1B69',
  inner: '#3A2580',
  footer: '#150834',
  accent: '#E91E8C',
  accentSoft: 'rgba(233,30,140,0.15)',
  border: 'rgba(255,255,255,0.10)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.65)',
  dim: 'rgba(255,255,255,0.40)',
  green: '#1D9E75',
  greenSoft: 'rgba(29,158,117,0.15)',
};

// ─── Template HTML ────────────────────────────────────────────────────────────
function buildHtml({ title, preheader, content }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background:${C.bg}; font-family:'Barlow',Arial,sans-serif; color:${C.text};">
  <div style="display:none;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background:${C.card}; border-radius:16px; overflow:hidden; border:1px solid ${C.border};">

        <!-- Header -->
        <tr><td style="background:${C.accent}; padding:24px 32px;">
          <table width="100%"><tr>
            <td style="color:#FFF; font-size:22px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase;">HOOP 4 A CAUSE</td>
            <td align="right" style="color:#FFF; font-size:11px; opacity:0.85; text-transform:uppercase;">Tournoi 5×5 · Juin 2026</td>
          </tr></table>
        </td></tr>

        <!-- Corps -->
        <tr><td style="padding:40px 32px; color:${C.text}; font-size:15px; line-height:1.65;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:${C.footer}; padding:28px 32px; border-top:1px solid ${C.border}; color:${C.muted}; font-size:12px; text-align:center;">
          <p style="margin:0 0 8px;"><strong style="color:${C.text}; font-size:14px; text-transform:uppercase; letter-spacing:1px;">Hoop 4 A Cause</strong></p>
          <p style="margin:0 0 12px;">Tournoi caritatif · Plan-les-Ouates, Suisse</p>
          <p style="margin:0 0 12px;"><a href="https://h4ac.ch" style="color:${C.accent}; text-decoration:none;">h4ac.ch</a></p>
          <p style="margin:0; color:${C.dim}; font-size:11px;">Email automatique, merci de ne pas y répondre.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Bloc paiement selon méthode ──────────────────────────────────────────────
function buildPaymentBlock({ registration, isCapitaine }) {
  if (!isCapitaine) return '';

  const amount = registration.total_amount;
  const method = registration.payment_method;
  const ref = registration.reference_code;

  if (method === 'twint') {
    return `
      <div style="background:${C.accentSoft}; border:1px solid rgba(233,30,140,0.30); border-radius:12px; margin:24px 0; padding:24px;">
        <div style="font-size:12px; font-weight:700; color:${C.accent}; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:16px;">
          Paiement Twint — ${amount}.– CHF
        </div>
        <table width="100%">
          <tr><td style="color:${C.muted}; font-size:13px; padding:6px 0;">1. Ouvre ton app Twint</td></tr>
          <tr><td style="color:${C.muted}; font-size:13px; padding:6px 0;">2. Envoie <strong style="color:${C.text};">${amount}.– CHF</strong> au :</td></tr>
        </table>
        <div style="background:${C.inner}; border-radius:8px; padding:14px 18px; margin:12px 0; font-size:22px; font-weight:900; letter-spacing:2px; text-align:center;">
          079 153 20 08
        </div>
        <div style="color:${C.muted}; font-size:13px; margin-top:8px;">
          3. Dans le message, indique : <strong style="color:${C.text};">${ref}</strong>
        </div>
      </div>`;
  }

  if (method === 'iban') {
    const row = (label, val, mono = false) => `
      <tr>
        <td style="color:${C.muted}; font-size:12px; padding:6px 0; width:38%; text-transform:uppercase; letter-spacing:0.5px;">${label}</td>
        <td style="font-size:${mono ? '15px' : '14px'}; font-weight:${mono ? '900' : '600'}; padding:6px 0; letter-spacing:${mono ? '1px' : '0'};">${val}</td>
      </tr>`;
    return `
      <div style="background:${C.accentSoft}; border:1px solid rgba(233,30,140,0.30); border-radius:12px; margin:24px 0; padding:24px;">
        <div style="font-size:12px; font-weight:700; color:${C.accent}; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:16px;">
          Virement bancaire — ${amount}.– CHF
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.inner}; border-radius:10px;">
          <tr><td style="padding:16px 20px;">
            <table width="100%">
              ${row('Bénéficiaire', 'Noah Bang')}
              ${row('Banque', 'PostFinance')}
              ${row('IBAN', 'CH21 0900 0000 1688 3932 6', true)}
              ${row('Montant', `${amount}.– CHF`)}
              ${row('Message', ref, true)}
            </table>
          </td></tr>
        </table>
        <div style="color:${C.muted}; font-size:12px; margin-top:14px;">
          Ta place sera confirmée manuellement sous 48h après réception du virement.
        </div>
      </div>`;
  }

  return '';
}

// ─── Génère le contenu selon le rôle ──────────────────────────────────────────
function buildContent({ registration, recipient, role }) {
  const isCapitaine = role === 'capitaine' || role === 'solo';
  const isSolo = role === 'solo';
  const teamName = registration.team_name;
  const method = registration.payment_method;

  let intro;
  if (isSolo) {
    intro = `
      <h1 style="font-size:28px; font-weight:900; margin:0 0 16px; text-transform:uppercase;">Inscription confirmée</h1>
      <p style="margin:0 0 16px; color:${C.muted};">Salut <strong style="color:${C.text};">${recipient.firstName}</strong>,</p>
      <p style="margin:0 0 16px; color:${C.muted};">Ta participation au tournoi <strong style="color:${C.text};">Hoop 4 A Cause</strong> est enregistrée. Tu seras placé(e) dans une équipe le jour J.</p>`;
  } else if (role === 'capitaine') {
    intro = `
      <h1 style="font-size:28px; font-weight:900; margin:0 0 16px; text-transform:uppercase;">Équipe inscrite !</h1>
      <p style="margin:0 0 16px; color:${C.muted};">Salut <strong style="color:${C.text};">${recipient.firstName}</strong>,</p>
      <p style="margin:0 0 16px; color:${C.muted};">Ton équipe <strong style="color:${C.accent};">${teamName}</strong> est officiellement inscrite. Chaque joueur recevra un email de confirmation.</p>`;
  } else {
    const roleLabel = role === 'titulaire' ? 'titulaire' : 'remplaçant(e)';
    intro = `
      <h1 style="font-size:28px; font-weight:900; margin:0 0 16px; text-transform:uppercase;">Tu es de la partie !</h1>
      <p style="margin:0 0 16px; color:${C.muted};">Salut <strong style="color:${C.text};">${recipient.firstName}</strong>,</p>
      <p style="margin:0 0 16px; color:${C.muted};">Tu as été inscrit(e) comme <strong style="color:${C.accent};">${roleLabel}</strong> dans l'équipe <strong style="color:${C.accent};">${teamName}</strong>.</p>`;
  }

  let paymentNote = '';
  if (!isCapitaine) {
    paymentNote = `<p style="margin:0 0 16px; color:${C.muted};">Le capitaine de l'équipe s'occupe du règlement. Tu n'as rien à faire.</p>`;
  } else if (method === 'twint' || method === 'iban') {
    paymentNote = `<p style="margin:0 0 8px; color:${C.muted};">Ton inscription est <strong style="color:${C.text};">en attente de paiement</strong>. Suis les instructions ci-dessous pour finaliser.</p>`;
  }

  const refCard = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.accentSoft}; border:1px solid rgba(233,30,140,0.30); border-radius:12px; margin:16px 0;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:12px; font-weight:700; color:${C.accent}; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:8px;">Référence d'inscription</div>
        <div style="font-size:26px; font-weight:900; letter-spacing:1px;">${registration.reference_code}</div>
        <div style="color:${C.muted}; font-size:13px; margin-top:8px;">Garde cette référence en cas de question.</div>
      </td></tr>
    </table>`;

  const recapRow = (label, value) => `
    <table width="100%"><tr>
      <td width="45%" style="color:${C.muted}; font-size:12px; padding:5px 0; text-transform:uppercase; letter-spacing:0.6px;">${label}</td>
      <td style="font-size:14px; font-weight:600; padding:5px 0;">${value}</td>
    </tr></table>`;

  const methodLabel = { twint: 'Twint', iban: 'Virement IBAN' };

  const recap = `
    <div style="font-size:12px; font-weight:700; color:${C.accent}; text-transform:uppercase; letter-spacing:1.2px; margin:24px 0 12px;">Récapitulatif</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.inner}; border:1px solid ${C.border}; border-radius:12px;">
      <tr><td style="padding:20px 24px;">
        ${recapRow('Mode', registration.mode === 'equipe' ? 'Équipe' : 'Solo')}
        ${teamName ? recapRow('Équipe', teamName) : ''}
        ${recapRow('Format', '5×5 · Mixte')}
        ${recapRow('Date', 'Juin 2026')}
        ${recapRow('Lieu', 'Plan-les-Ouates, Genève')}
        ${isCapitaine ? recapRow('Total', `${registration.total_amount}.– CHF`) : ''}
        ${isCapitaine && method ? recapRow('Paiement', methodLabel[method] || method) : ''}
      </td></tr>
    </table>`;

  const paymentBlock = buildPaymentBlock({ registration, isCapitaine });

  return intro + paymentNote + refCard + recap + paymentBlock;
}

// ─── Construit subject + html ─────────────────────────────────────────────────
function buildEmail({ registration, recipient, role }) {
  const method = registration.payment_method;
  const methodSuffix = method === 'twint' ? ' · Twint' : method === 'iban' ? ' · Virement' : '';

  const subject = role === 'solo'
    ? `Inscription enregistrée${methodSuffix} — ${registration.reference_code}`
    : role === 'capitaine'
      ? `Équipe ${registration.team_name} inscrite${methodSuffix} — ${registration.reference_code}`
      : `Tu fais partie de ${registration.team_name} 🏀`;

  const preheader = `Réf ${registration.reference_code} · Tournoi H4AC juin 2026`;
  const content = buildContent({ registration, recipient, role });
  const html = buildHtml({ title: subject, preheader, content });
  return { subject, html };
}

// ─── Email admin (notif interne) ──────────────────────────────────────────────
function buildAdminEmail({ registration, players }) {
  const { reference_code, mode, team_name, total_amount, payment_method } = registration;
  const methodLabel = { twint: 'Twint', iban: 'Virement IBAN' };

  const roleLabel = { capitaine: 'Capitaine', solo: 'Solo', titulaire: 'Titulaire', remplacant: 'Remplaçant' };

  const playerRows = players.map(p => `
    <tr style="border-bottom:1px solid ${C.border};">
      <td style="padding:10px 14px; font-size:13px;">${p.first_name} ${p.last_name}</td>
      <td style="padding:10px 14px; font-size:13px; color:${C.muted};">${p.email}</td>
      <td style="padding:10px 14px; font-size:13px; color:${C.accent};">${roleLabel[p.role] || p.role}</td>
      <td style="padding:10px 14px; font-size:13px; color:${C.muted};">${p.jersey_size || '—'}</td>
    </tr>`).join('');

  const content = `
    <h1 style="font-size:24px; font-weight:900; margin:0 0 8px; text-transform:uppercase;">Nouvelle inscription 🏀</h1>
    <p style="margin:0 0 24px; color:${C.muted};">Une nouvelle inscription vient d'être enregistrée.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.accentSoft}; border:1px solid rgba(233,30,140,0.30); border-radius:12px; margin:0 0 24px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:12px; font-weight:700; color:${C.accent}; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:8px;">Référence</div>
        <div style="font-size:26px; font-weight:900; letter-spacing:1px;">${reference_code}</div>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.inner}; border:1px solid ${C.border}; border-radius:12px; margin:0 0 24px;">
      <tr><td style="padding:20px 24px;">
        <table width="100%">
          <tr>
            <td width="45%" style="color:${C.muted}; font-size:12px; padding:5px 0; text-transform:uppercase; letter-spacing:0.6px;">Mode</td>
            <td style="font-size:14px; font-weight:600; padding:5px 0;">${mode === 'equipe' ? 'Équipe' : 'Solo'}</td>
          </tr>
          ${team_name ? `<tr>
            <td width="45%" style="color:${C.muted}; font-size:12px; padding:5px 0; text-transform:uppercase; letter-spacing:0.6px;">Équipe</td>
            <td style="font-size:14px; font-weight:600; padding:5px 0; color:${C.accent};">${team_name}</td>
          </tr>` : ''}
          <tr>
            <td width="45%" style="color:${C.muted}; font-size:12px; padding:5px 0; text-transform:uppercase; letter-spacing:0.6px;">Paiement</td>
            <td style="font-size:14px; font-weight:600; padding:5px 0;">${methodLabel[payment_method] || payment_method}</td>
          </tr>
          <tr>
            <td width="45%" style="color:${C.muted}; font-size:12px; padding:5px 0; text-transform:uppercase; letter-spacing:0.6px;">Montant</td>
            <td style="font-size:14px; font-weight:600; padding:5px 0;">${total_amount}.– CHF</td>
          </tr>
          <tr>
            <td width="45%" style="color:${C.muted}; font-size:12px; padding:5px 0; text-transform:uppercase; letter-spacing:0.6px;">Joueurs</td>
            <td style="font-size:14px; font-weight:600; padding:5px 0;">${players.length}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <div style="font-size:12px; font-weight:700; color:${C.accent}; text-transform:uppercase; letter-spacing:1.2px; margin:0 0 12px;">Joueurs inscrits</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.inner}; border:1px solid ${C.border}; border-radius:12px; overflow:hidden;">
      <tr style="background:rgba(255,255,255,0.06);">
        <th style="padding:10px 14px; text-align:left; font-size:11px; color:${C.muted}; text-transform:uppercase; letter-spacing:0.6px;">Nom</th>
        <th style="padding:10px 14px; text-align:left; font-size:11px; color:${C.muted}; text-transform:uppercase; letter-spacing:0.6px;">Email</th>
        <th style="padding:10px 14px; text-align:left; font-size:11px; color:${C.muted}; text-transform:uppercase; letter-spacing:0.6px;">Rôle</th>
        <th style="padding:10px 14px; text-align:left; font-size:11px; color:${C.muted}; text-transform:uppercase; letter-spacing:0.6px;">Maillot</th>
      </tr>
      ${playerRows}
    </table>`;

  const subject = `[H4AC] Nouvelle inscription — ${reference_code}`;
  const preheader = `${mode === 'equipe' ? team_name : 'Solo'} · ${total_amount}.– CHF · ${methodLabel[payment_method] || payment_method}`;
  const html = buildHtml({ title: subject, preheader, content });
  return { subject, html };
}

// ─── Fonction principale ──────────────────────────────────────────────────────
async function sendConfirmation(registration, players) {
  const results = [];

  // Emails aux participants
  for (const player of players) {
    const recipient = { firstName: player.first_name, lastName: player.last_name };
    const { subject, html } = buildEmail({ registration, recipient, role: player.role });

    try {
      const { data, error } = await resend.emails.send({
        from: FROM,
        to: player.email,
        subject,
        html,
      });
      if (error) {
        console.error(`[email] Erreur ${player.email}:`, error.message);
        results.push({ email: player.email, ok: false, error: error.message });
      } else {
        console.log(`[email] ✓ envoyé à ${player.email} (id: ${data.id})`);
        results.push({ email: player.email, ok: true, id: data.id });
      }
    } catch (err) {
      console.error(`[email] Exception ${player.email}:`, err);
      results.push({ email: player.email, ok: false, error: err.message });
    }
  }

  // Email admin (notif interne)
  try {
    const { subject, html } = buildAdminEmail({ registration, players });
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject,
      html,
    });
    if (error) {
      console.error('[email] Erreur notif admin:', error.message);
    } else {
      console.log(`[email] ✓ notif admin envoyée (id: ${data.id})`);
    }
  } catch (err) {
    console.error('[email] Exception notif admin:', err);
  }

  const sent = results.filter(r => r.ok).length;
  console.log(`[email] ${registration.reference_code} : ${sent}/${players.length} envoyé(s)`);
  return { sent, failed: players.length - sent, results };
}

// ─── Email "paiement reçu" ────────────────────────────────────────────────────
async function sendPaymentConfirmed(registration) {
  const { reference_code, mode, team_name, total_amount, captain_email, captain_first_name } = registration;
  const isEquipe = mode === 'equipe';
  const subject = isEquipe
    ? `Paiement reçu — ${team_name} est officiellement inscrite !`
    : `Paiement reçu — Ta place est confirmée !`;

  const preheader = `Réf ${reference_code} · Paiement de ${total_amount}.– CHF reçu`;

  const content = `
    <h1 style="font-size:28px; font-weight:900; margin:0 0 16px; text-transform:uppercase;">Paiement confirmé !</h1>
    <p style="margin:0 0 16px; color:${C.muted};">Salut <strong style="color:${C.text};">${captain_first_name || 'joueur(se)'}</strong>,</p>
    <p style="margin:0 0 24px; color:${C.muted};">
      ${isEquipe
        ? `Nous avons bien reçu le paiement pour l'équipe <strong style="color:${C.accent};">${team_name}</strong>.`
        : `Nous avons bien reçu ton paiement de <strong style="color:${C.text};">${total_amount}.– CHF</strong>.`
      }
      <strong style="color:${C.text};"> Ta place est définitivement réservée.</strong>
    </p>

    <div style="background:${C.greenSoft}; border:1px solid rgba(29,158,117,0.35); border-radius:12px; padding:20px 24px; margin:0 0 24px;">
      <div style="display:flex; align-items:center; gap:14px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${C.green}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <div>
          <div style="font-weight:700; font-size:15px; color:${C.green};">Place confirmée</div>
          <div style="color:${C.muted}; font-size:13px; margin-top:2px;">Tournoi Hoop 4 A Cause · Juin 2026 · Plan-les-Ouates</div>
        </div>
      </div>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.accentSoft}; border:1px solid rgba(233,30,140,0.30); border-radius:12px; margin:0 0 24px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:12px; font-weight:700; color:${C.accent}; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:8px;">Référence d'inscription</div>
        <div style="font-size:26px; font-weight:900; letter-spacing:1px;">${reference_code}</div>
      </td></tr>
    </table>

    <p style="color:${C.muted}; font-size:14px; margin:0;">On se retrouve sur le terrain en juin. Prépare-toi !</p>`;

  const html = buildHtml({ title: subject, preheader, content });

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: captain_email,
    subject,
    html,
  });

  if (error) throw new Error(error.message);
  console.log(`[email] Paiement confirmé envoyé à ${captain_email} (id: ${data.id})`);
  return { id: data.id };
}

module.exports = { sendConfirmation, sendPaymentConfirmed };