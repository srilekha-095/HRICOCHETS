import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import * as emailService from "../emailService.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// Helper: simple validation
function validateSignup({ name, email, password }) {
  if (!name || !email || !password)
    return "name, email and password are required.";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "invalid email";

  if (password.length < 6)
    return "password must be at least 6 characters";

  return null;
}

// ===================== SIGNUP =====================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const err = validateSignup({ name, email, password });
    if (err) {
      return res.status(400).json({ success: false, message: err });
    }

    const hashed = await bcrypt.hash(password, 10);

    const insertQ = `
      INSERT INTO users (name, email, phone, password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, phone
    `;

    const values = [name, email, phone || "", hashed];
    const result = await pool.query(insertQ, values);

    const user = result.rows[0];

    // 🔔 Emails (NON-BLOCKING)
    try {
      await emailService.sendWelcomeEmail(user);
      await emailService.sendOwnerNewUserNotification(user);
    } catch (emailErr) {
      console.warn("Signup email failed (non-blocking):", emailErr.message);
    }

    return res.json({
      success: true,
      message: "Account created",
      user,
    });

  } catch (err) {
    console.error("Signup error:", err);

    if (err?.code === "23505") {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ===================== LOGIN =====================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const q = `
      SELECT id, name, email, phone, password
      FROM users
      WHERE email = $1
    `;

    const r = await pool.query(q, [email]);

    if (r.rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const user = r.rows[0];

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🔔 Login email (NON-BLOCKING)
    try {
      await emailService.sendLoginNotification(user);
    } catch (emailErr) {
      console.warn("Login email failed (non-blocking):", emailErr.message);
    }

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
});

export default router;
