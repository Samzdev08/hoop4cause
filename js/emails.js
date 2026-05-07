const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Hoop 4 A Cause <onboarding@resend.dev>';

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

// ─── Génère le contenu selon le rôle ──────────────────────────────────────────
function buildContent({ registration, recipient, role }) {

  const isCapitaine = role === 'capitaine';
  const isSolo = role === 'solo';
  const teamName = registration.team_name;

  let intro;

  if (isSolo) {
    intro = `
      <h1 style="font-size:28px; font-weight:900; margin:0 0 16px; text-transform:uppercase;">Inscription confirmée</h1>
      <p style="margin:0 0 16px; color:${C.muted};">Salut <strong style="color:${C.text};">${recipient.firstName}</strong>,</p>
      <p style="margin:0 0 16px; color:${C.muted};">Ta participation au tournoi <strong style="color:${C.text};">Hoop 4 A Cause</strong> est confirmée. Tu seras placé(e) dans une équipe le jour J.</p>`;
  } else if (isCapitaine) {
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

  const recap = `
    <div style="font-size:12px; font-weight:700; color:${C.accent}; text-transform:uppercase; letter-spacing:1.2px; margin:24px 0 12px;">Récapitulatif</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.inner}; border:1px solid ${C.border}; border-radius:12px;">
      <tr><td style="padding:20px 24px;">
        ${recapRow('Mode', registration.mode === 'equipe' ? 'Équipe' : 'Solo')}
        ${teamName ? recapRow('Équipe', teamName) : ''}
        ${recapRow('Format', '5×5 · Mixte')}
        ${recapRow('Date', 'Juin 2026')}
        ${recapRow('Lieu', 'Plan-les-Ouates, Genève')}
        ${isCapitaine ? recapRow('Total payé', `${registration.total_amount}.– CHF`) : ''}
      </td></tr>
    </table>`;

  const cta = `
    <table cellpadding="0" cellspacing="0" style="margin:24px auto;"><tr>
      <td style="background:${C.accent}; border-radius:10px;">
        <a href="https://h4ac.ch/inscription/${registration.reference_code}" style="display:inline-block; padding:14px 36px; color:#FFF; text-decoration:none; font-weight:700; text-transform:uppercase; letter-spacing:1.2px;">Voir mon inscription</a>
      </td>
    </tr></table>`;

  return intro + refCard + recap + cta;
}

// ─── Construit subject + html ─────────────────────────────────────────────────
function buildEmail({ registration, recipient, role }) {

  const subject = role === 'solo'
    ? `Inscription confirmée — ${registration.reference_code}`
    : role === 'capitaine'
      ? `Équipe ${registration.team_name} inscrite — ${registration.reference_code}`
      : `Tu fais partie de ${registration.team_name} 🏀`;

  const preheader = `Réf ${registration.reference_code} · Tournoi H4AC juin 2026`;

  const content = buildContent({ registration, recipient, role });
  const html = buildHtml({ title: subject, preheader, content });

  return { subject, html };
}

// ─── Fonction principale appelée par server.js ────────────────────────────────
async function sendConfirmation(registration, players) {

  const results = [];

  for (const player of players) {

    const recipient = {
      firstName: player.first_name,
      lastName: player.last_name,
    };

    const { subject, html } = buildEmail({
      registration,
      recipient,
      role: player.role,
    });

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

  const sent = results.filter(r => r.ok).length;
  console.log(`[email] ${registration.reference_code} : ${sent}/${players.length} envoyé(s)`);

  return { sent, failed: players.length - sent, results };
}

module.exports = { sendConfirmation };