require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");

const app = express();

const allowedOrigins = [
  "https://h4ac.ch",
  "https://www.h4ac.ch",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));;

app.use(express.json());

/* ── RATE LIMITING ── */
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Trop de tentatives, réessaie dans une minute." }
});

app.use("/api/waitlist", limiter);

/* ── SUPABASE ── */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ── MAILER ── */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ── ROUTE ── */
app.post("/api/waitlist", async (req, res) => {
  const { email, website } = req.body;

  try {
    // Honeypot
    if (website) {
      return res.json({ success: false, message: "Erreur" });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.json({ success: false, message: "Email invalide." });
    }

    // Doublon
    const { data: existing } = await supabase
      .from("waitlist")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return res.json({ success: true, message: "Déjà inscrit 🔥" });
    }

    // Insert
    const { error } = await supabase
      .from("waitlist")
      .insert([{ email }]);

    if (error) {
      console.error("Supabase insert error:", error);
      return res.json({ success: false, message: "Erreur serveur, réessaie." });
    }

    // Email de confirmation
    await transporter.sendMail({
      from: `"Hoop 4 A Cause" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🏀 Tu es sur la liste — Hoop 4 A Cause",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#1A0A3D;padding:2rem;border-radius:16px">
          <h2 style="color:#E91E8C;font-family:Arial,sans-serif;margin:0 0 .5rem">HOOP 4 A CAUSE 🏀</h2>
          <h3 style="color:#fff;margin:0 0 1.5rem;font-size:1.1rem">Tu es bien sur la liste !</h3>
          <p style="color:rgba(255,255,255,.7);line-height:1.6;margin:0 0 1rem">
            Les inscriptions ouvrent le <strong style="color:#fff">20 avril 2026</strong>.<br>
            Tu seras parmi les premiers notifiés.
          </p>
          <div style="background:rgba(233,30,140,.1);border:1px solid rgba(233,30,140,.3);border-radius:10px;padding:1rem;margin:1.5rem 0">
            <p style="color:rgba(255,255,255,.9);margin:0;font-size:.9rem">
              📅 <strong>Tournoi 5×5</strong> — 21 Juin 2026<br>
              📍 Chem. Le-Sapay 10, Plan-les-Ouates<br>
              🏆 Cash Prize : <strong>1000 CHF</strong>
            </p>
          </div>
          <p style="color:rgba(255,255,255,.7);line-height:1.6;margin:0 0 1.5rem">
            En attendant, suis-nous sur Instagram pour ne rien rater :
          </p>
          <a href="https://www.instagram.com/h4ac_tournament/"
             style="display:inline-block;background:#E91E8C;color:#fff;text-decoration:none;
                    padding:.75rem 1.75rem;border-radius:999px;font-weight:700;font-size:.95rem">
            @h4ac_tournament
          </a>
          <p style="color:rgba(255,255,255,.25);font-size:.75rem;margin-top:2rem">
            Tu reçois cet email car tu t'es inscrit pour recevoir une notification lorsque les inscriptions seront ouvertes sur h4ac.ch.<br>
            Un projet de maturité gymnasiale — Noah Bang, CECG Mme de Staël.
          </p>
        </div>
      `
    });

    return res.json({ success: true, message: "Inscrit 🔥 Check tes emails !" });

  } catch (err) {
    console.error("Unexpected error:", err);
    return res.json({ success: false, message: "Erreur serveur, réessaie." });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`🔥 Server running on port ${process.env.PORT || 3000}`);
});