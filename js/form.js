require("dotenv").config({path: "../.env"});

const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const app = express();
app.use(cors());
app.use(express.json());

// Supabase (clé privée côté serveur)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post("/api/waitlist", async (req, res) => {
  const { email, website } = req.body;

  try {
    if (website) {
      return res.json({ success: false, message: "Erreur" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.json({ success: false, message: "Email invalide" });
    }

    // 🔍 CHECK SI EMAIL EXISTE DÉJÀ
    const { data: existing } = await supabase
      .from("waitlist")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return res.json({
        success: true,
        message: "Déjà inscrit 🔥"
      });
      
    }

    // 🔥 INSERT
    const { data, error } = await supabase
      .from("waitlist")
      .insert([{ email }])
      .select();

    if (error) {
      console.log("SUPABASE ERROR:", error);

      return res.json({
        success: false,
        message: "Erreur serveur"
      });
    }

    // 📧 EMAIL
    await transporter.sendMail({
      from: `"Hoop4Cause" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔥 Bienvenue",
      html: `<p>Tu es inscrit 🔥</p>`
    });

    return res.json({
      success: true,
      message: "Inscrit 🔥"
    });

  } catch (err) {
    return res.json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

// lancer serveur
app.listen(process.env.PORT, () => {
  console.log(`🔥 Server running on port ${process.env.PORT}`);
});