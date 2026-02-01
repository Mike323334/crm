const express = require("express");
const crypto = require("crypto");
const Invite = require("../models/Invite");
const Company = require("../models/Company");
const User = require("../models/User");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();
const allowedDomain = process.env.ALLOWED_DOMAIN?.toLowerCase();

router.use(auth);

router.get("/", requireRole("admin"), async (req, res) => {
  const invites = await Invite.find({ companyId: req.user.companyId }).sort({
    createdAt: -1
  });
  res.json({ invites });
});

router.post("/", requireRole("admin"), async (req, res) => {
  const { email, role = "member" } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const company = await Company.findById(req.user.companyId);
  if (!company) {
    return res.status(400).json({ message: "Company not found" });
  }

  const emailDomain = normalizedEmail.split("@")[1] || "";
  if (allowedDomain && emailDomain !== allowedDomain) {
    return res.status(403).json({ message: "Email domain not allowed" });
  }
  if (emailDomain !== company.domain) {
    return res.status(403).json({ message: "Email domain not allowed" });
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }

  const existingInvite = await Invite.findOne({
    email: normalizedEmail,
    companyId: req.user.companyId,
    status: "pending"
  });
  if (existingInvite) {
    return res.status(409).json({ message: "Invite already pending" });
  }

  const token = crypto.randomBytes(24).toString("hex");
  const invite = await Invite.create({
    email: normalizedEmail,
    token,
    role,
    companyId: req.user.companyId,
    invitedBy: req.user.id
  });

  return res.status(201).json({ invite });
});

module.exports = router;
