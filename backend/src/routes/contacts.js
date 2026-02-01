const express = require("express");
const Contact = require("../models/Contact");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/", async (req, res) => {
  const search = req.query.search?.trim();
  const query = { companyId: req.user.companyId };

  if (search) {
    query.$or = [
      { firstName: new RegExp(search, "i") },
      { lastName: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { company: new RegExp(search, "i") }
    ];
  }

  const contacts = await Contact.find(query).sort({ createdAt: -1 });
  res.json({ contacts });
});

router.post("/", async (req, res) => {
  const payload = {
    ...req.body,
    companyId: req.user.companyId,
    ownerId: req.user.id
  };

  const contact = await Contact.create(payload);
  res.status(201).json({ contact });
});

router.get("/:id", async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    companyId: req.user.companyId
  });

  if (!contact) {
    return res.status(404).json({ message: "Contact not found" });
  }

  return res.json({ contact });
});

router.put("/:id", async (req, res) => {
  const { companyId, ownerId, ...updates } = req.body;
  const contact = await Contact.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    updates,
    { new: true }
  );

  if (!contact) {
    return res.status(404).json({ message: "Contact not found" });
  }

  return res.json({ contact });
});

router.delete("/:id", requireRole("admin", "manager"), async (req, res) => {
  const contact = await Contact.findOneAndDelete({
    _id: req.params.id,
    companyId: req.user.companyId
  });

  if (!contact) {
    return res.status(404).json({ message: "Contact not found" });
  }

  return res.json({ success: true });
});

module.exports = router;
