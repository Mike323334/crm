const express = require("express");
const crypto = require("crypto");
const Invite = require("../models/Invite");
const Company = require("../models/Company");
const User = require("../models/User");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();
const allowedDomains = process.env.ALLOWED_DOMAIN
  ? process.env.ALLOWED_DOMAIN.split(",").map((item) => item.trim().toLowerCase())
  : [];
const isAllowedDomain = (domain) =>
  allowedDomains.length === 0 || allowedDomains.includes(domain);

router.use(auth);

router.get("/", requireRole("admin"), async (req, res) => {
  const invites = await Invite.find({ companyId: req.user.companyId }).sort({
    createdAt: -1
  });
  res.json({ invites });
});

router.post("/", requireRole("admin"), async (req, res) => {
  const { email, role = "member", expiresInDays = 7 } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const company = await Company.findById(req.user.companyId);
  if (!company) {
    return res.status(400).json({ message: "Company not found" });
  }

  const emailDomain = normalizedEmail.split("@")[1] || "";
  if (!isAllowedDomain(emailDomain)) {
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
  const expiresAt =
    expiresInDays === null
      ? null
      : new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000);
  const invite = await Invite.create({
    email: normalizedEmail,
    token,
    role,
    companyId: req.user.companyId,
    invitedBy: req.user.id,
    expiresAt
  });

  return res.status(201).json({ invite });
});

router.put("/:id/revoke", requireRole("admin"), async (req, res) => {
  const invite = await Invite.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    { status: "revoked" },
    { new: true }
  );

  if (!invite) {
    return res.status(404).json({ message: "Invite not found" });
  }

  return res.json({ invite });
});

module.exports = router;
