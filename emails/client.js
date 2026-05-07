const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'Hoop 4 A Cause <noreply@h4ac.ch>';

/**
 * Envoie un email via Resend.
 *
 * @param {Object} opts
 * @param {string|string[]} opts.to     - destinataire(s)
 * @param {string}          opts.subject
 * @param {string}          opts.html
 * @param {string}          [opts.replyTo]
 * @returns {Promise<{ok: boolean, id?: string, error?: string}>}
 */
async function sendEmail({ to, subject, html, replyTo }) {

  if (!process.env.RESEND_API_KEY) {

    console.warn(
      '[email] RESEND_API_KEY manquant — email ignoré'
    );

    return { ok: false, error: 'API key missing' };
  }

  try {

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      replyTo,
    });

    if (error) {

      console.error('[email] Resend error:', error);

      return { ok: false, error: error.message };
    }

    console.log(
      `[email] ✓ envoyé à ${to} (id: ${data.id})`
    );

    return { ok: true, id: data.id };

  } catch (err) {

    console.error('[email] Exception:', err);

    return { ok: false, error: err.message };
  }
}

module.exports = { sendEmail };