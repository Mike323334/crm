const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");
const Invite = require("../models/Invite");
const { auth } = require("../middleware/auth");

const getEmailDomain = (email) => email.split("@")[1]?.toLowerCase() || "";
const allowedDomain = process.env.ALLOWED_DOMAIN?.toLowerCase();

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { sub: user.id, companyId: user.companyId.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

router.post("/register", async (req, res) => {
  try {
    const { email, password, inviteToken, companyName, companyDomain } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    let companyId;
    let role = "member";

    if (inviteToken) {
      const invite = await Invite.findOne({
        token: inviteToken,
        status: "pending"
      });
      if (!invite) {
        return res.status(400).json({ message: "Invalid invite" });
      }
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invite expired" });
      }

      const emailDomain = getEmailDomain(normalizedEmail);
      const company = await Company.findById(invite.companyId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
      if (allowedDomain && emailDomain !== allowedDomain) {
        return res.status(403).json({ message: "Email domain not allowed" });
      }
      if (company.domain !== emailDomain) {
        return res.status(403).json({ message: "Email domain not allowed" });
      }
      if (invite.email !== normalizedEmail) {
        return res.status(403).json({ message: "Invite email mismatch" });
      }

      companyId = invite.companyId;
      role = invite.role;
      invite.status = "accepted";
      await invite.save();
    } else {
      const existingUsers = await User.countDocuments();
      if (existingUsers > 0) {
        return res.status(403).json({ message: "Invite required" });
      }
      if (!companyName || !companyDomain) {
        return res
          .status(400)
          .json({ message: "Company name and domain required" });
      }
      const emailDomain = getEmailDomain(normalizedEmail);
      if (allowedDomain && emailDomain !== allowedDomain) {
        return res.status(403).json({ message: "Email domain not allowed" });
      }
      if (emailDomain !== companyDomain.toLowerCase()) {
        return res.status(403).json({ message: "Email domain not allowed" });
      }

      const company = await Company.create({
        name: companyName,
        domain: companyDomain.toLowerCase()
      });
      companyId = company.id;
      role = "admin";
    }

    const user = await User.create({
      email: normalizedEmail,
      password,
      companyId,
      role
    });
    const token = signToken(user);
    return res.status(201).json({ token });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const matches = await user.comparePassword(password);
    if (!matches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({ token });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ user });
});

module.exports = router;
