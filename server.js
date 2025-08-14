require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const sendEmail = require("./utils/email");
const User = require("./models/User");

const app = express();

// ---------- Config ----------
const PORT = process.env.PORT || 8080;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

// Allow JSON bodies
app.use(express.json());

// CORS (lock to your site when you deploy)
app.use(
  cors({
    origin: FRONTEND_URL === "*" ? "*" : [FRONTEND_URL],
    credentials: false,
  })
);

// ---------- DB Connect ----------
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  }
})();

// ---------- Helpers ----------
const genCode = (len = 6) =>
  Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join("");

// PayPal access token
async function getPayPalAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  const auth = Buffer.from(`${client}:${secret}`).toString("base64");
  const resp = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`PayPal token error: ${text}`);
  }
  const data = await resp.json();
  return data.access_token;
}

// ---------- Routes ----------

// Health
app.get("/", (req, res) => {
  res.json({ ok: true, service: "MoneyTalks API" });
});

/**
 * Register
 * body: { username, email, password }
 * - saves user
 * - sends email verification code
 */
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const exists = await User.findOne({
      $or: [{ email: email.toLowerCase
