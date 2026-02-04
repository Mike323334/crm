const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const sendgrid = require("@sendgrid/mail");
const User = require("../models/User");
const Company = require("../models/Company");
const Invite = require("../models/Invite");
const { auth } = require("../middleware/auth");

const getEmailDomain = (email) => email.split("@")[1]?.toLowerCase() || "";
const allowedDomains = process.env.ALLOWED_DOMAIN
  ? process.env.ALLOWED_DOMAIN.split(",").map((item) => item.trim().toLowerCase())
  : [];

const isAllowedDomain = (domain) =>
  allowedDomains.length === 0 || allowedDomains.includes(domain);

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
      if (invite.status === "revoked") {
        return res.status(400).json({ message: "Invite revoked" });
      }
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invite expired" });
      }

      const emailDomain = getEmailDomain(normalizedEmail);
      const company = await Company.findById(invite.companyId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
      if (!isAllowedDomain(emailDomain)) {
        return res.status(403).json({ message: "Email domain not allowed" });
      }
      const companyDomains =
        company.domains && company.domains.length > 0
          ? company.domains
          : [company.domain].filter(Boolean);
      if (!companyDomains.includes(emailDomain)) {
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
      if (!isAllowedDomain(emailDomain)) {
        return res.status(403).json({ message: "Email domain not allowed" });
      }
      if (emailDomain !== companyDomain.toLowerCase()) {
        return res.status(403).json({ message: "Email domain not allowed" });
      }

      const domainValue = companyDomain.toLowerCase();
      const company = await Company.create({
        name: companyName,
        domain: domainValue,
        domains: [domainValue]
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
    if (!user.isActive) {
      return res.status(403).json({ message: "Account disabled" });
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

router.post("/forgot", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(200).json({ success: true });
  }

  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || "";
  const resetLink = frontendUrl
    ? `${frontendUrl}/reset?token=${token}`
    : null;

  const hasSmtp = Boolean(process.env.SMTP_HOST);
  const hasSendgrid = Boolean(process.env.SENDGRID_API_KEY);

  if (resetLink && hasSendgrid) {
    try {
      sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
      const fromEmail = process.env.SENDGRID_FROM || process.env.SMTP_FROM;
      if (!fromEmail) {
        throw new Error("SENDGRID_FROM is required");
      }
      await sendgrid.send({
        to: normalizedEmail,
        from: fromEmail,
        subject: "Reset your CRM password",
        text: `Use this link to reset your password: ${resetLink}`,
        html: `<p>Use this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
      });
      // eslint-disable-next-line no-console
      console.log(`Reset email sent to ${normalizedEmail} via SendGrid`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to send reset email via SendGrid", error);
    }
  } else if (resetLink && hasSmtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: normalizedEmail,
        subject: "Reset your CRM password",
        text: `Use this link to reset your password: ${resetLink}`,
        html: `<p>Use this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
      });
      // eslint-disable-next-line no-console
      console.log(`Reset email sent to ${normalizedEmail}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to send reset email", error);
    }
  } else if (!resetLink || !hasSmtp) {
    // eslint-disable-next-line no-console
    console.warn(
      "Reset email not sent (missing FRONTEND_URL or email provider)."
    );
  }

  const response = { success: true };
  if (!hasSmtp && !hasSendgrid) {
    response.resetToken = token;
    response.resetLink = resetLink;
  }

  return res.json(response);
});

router.post("/reset", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: "Token and password required" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.password = password;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return res.json({ success: true });
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ user });
});

module.exports = router;
