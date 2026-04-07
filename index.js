require("dotenv").config(); 
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors({
  origin: "https://h4ac.ch", 
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
      return res.json({ success: false, message: "Erreur serveur" });
    }
    await transporter.sendMail({
      from: `"Hoop4Cause" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔥 Bienvenue sur Hoop4Cause",
      html: `<p>Tu es bien inscrit 🔥</p>`
    });
    return res.json({ success: true, message: "Inscrit 🔥" });
  } catch (err) {
    return res.json({ success: false, message: "Erreur serveur" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`🔥 Server running`);
});