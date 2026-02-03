const express = require("express");
const User = require("../models/User");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/", requireRole("admin"), async (req, res) => {
  const users = await User.find({ companyId: req.user.companyId }).select(
    "email role isActive createdAt"
  );
  res.json({ users });
});

router.put("/:id/role", requireRole("admin"), async (req, res) => {
  const { role } = req.body;
  if (!["admin", "manager", "member"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    { role },
    { new: true }
  ).select("email role isActive createdAt");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user });
});

router.put("/:id/status", requireRole("admin"), async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    { isActive: Boolean(isActive) },
    { new: true }
  ).select("email role isActive createdAt");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user });
});

router.put("/:id/password", requireRole("admin"), async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  const user = await User.findOne({
    _id: req.params.id,
    companyId: req.user.companyId
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.password = password;
  await user.save();

  return res.json({ success: true });
});

module.exports = router;
