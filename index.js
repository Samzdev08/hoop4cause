require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");

const app = express();

app.set("trust proxy", 1);

app.use(cors({
    origin: "https://h4ac.ch",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

app.use("/api/waitlist", rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Trop de tentatives, réessaie dans une minute." }
}));

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

app.get("/api/health", (req, res) => {
    res.status(200).send("OK");
});

app.post("/api/waitlist", async (req, res) => {
    const { email, website } = req.body;

    try {
        if (website) {
            return res.json({ success: false, message: "Erreur" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.json({ success: false, message: "Email invalide." });
        }

        const { data: existing } = await supabase
            .from("waitlist")
            .select("email")
            .eq("email", email)
            .maybeSingle();

        if (existing) {
            return res.json({ success: true, message: "Déjà inscrit 🔥" });
        }

        const { error } = await supabase
            .from("waitlist")
            .insert([{ email }]);

        if (error) {
            return res.json({ success: false, message: "Erreur serveur." });
        }

        console.log("Nouvel inscrit :", email);

        res.json({ success: true, message: "Inscrit 🔥 Check tes emails !" });

        transporter.sendMail({
            from: `"Hoop 4 A Cause" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "🏀 Tu es sur la liste — Hoop 4 A Cause",
            html: `
            <meta name="color-scheme" content="dark">
            <meta name="supported-color-schemes" content="dark">

            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#1A0A3D !important;padding:2rem;border-radius:16px;color:#ffffff;">

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
                           padding:.75rem 1.75rem;border-radius:999px;font-weight:700;font-size:.95rem;">
                    @h4ac_tournament
                </a>

                <p style="color:rgba(255,255,255,.25);font-size:.75rem;margin-top:2rem">
                    Tu reçois cet email car tu t'es inscrit pour recevoir une notification lorsque les inscriptions seront ouvertes sur h4ac.ch.<br>
                    Un projet de maturité gymnasiale — Noah Bang, CECG Mme de Staël.
                </p>

            </div>
            `
        }).then(() => {
            console.log("Email envoyé :", email);
        }).catch((err) => {
            console.error("Email error :", err.message);
        });

    } catch (err) {
        return res.json({ success: false, message: "Erreur serveur." });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`🔥 Server running on port ${process.env.PORT || 3000}`);
});