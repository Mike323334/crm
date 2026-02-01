const express = require("express");
const Deal = require("../models/Deal");
const Contact = require("../models/Contact");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/", async (req, res) => {
  const query = { companyId: req.user.companyId };
  if (req.query.contactId) {
    query.contactId = req.query.contactId;
  }

  const deals = await Deal.find(query).sort({ createdAt: -1 });
  res.json({ deals });
});

router.post("/", async (req, res) => {
  const { contactId } = req.body;
  const contact = await Contact.findOne({
    _id: contactId,
    companyId: req.user.companyId
  });

  if (!contact) {
    return res.status(404).json({ message: "Contact not found" });
  }

  const deal = await Deal.create({
    ...req.body,
    companyId: req.user.companyId,
    ownerId: req.user.id
  });
  return res.status(201).json({ deal });
});

router.put("/:id", async (req, res) => {
  const { companyId, ownerId, contactId, ...updates } = req.body;
  const deal = await Deal.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    updates,
    { new: true }
  );

  if (!deal) {
    return res.status(404).json({ message: "Deal not found" });
  }

  return res.json({ deal });
});

router.delete("/:id", requireRole("admin", "manager"), async (req, res) => {
  const deal = await Deal.findOneAndDelete({
    _id: req.params.id,
    companyId: req.user.companyId
  });

  if (!deal) {
    return res.status(404).json({ message: "Deal not found" });
  }

  return res.json({ success: true });
});

module.exports = router;
