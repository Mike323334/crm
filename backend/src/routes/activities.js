const express = require("express");
const Activity = require("../models/Activity");
const Contact = require("../models/Contact");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/", async (req, res) => {
  const query = { companyId: req.user.companyId };
  if (req.query.contactId) {
    query.contactId = req.query.contactId;
  }

  const activities = await Activity.find(query).sort({ createdAt: -1 });
  res.json({ activities });
});

router.get("/notifications", async (req, res) => {
  const days = Number(req.query.days || 7);
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const [overdue, upcoming] = await Promise.all([
    Activity.find({
      companyId: req.user.companyId,
      status: { $ne: "done" },
      dueDate: { $lt: now }
    }).sort({ dueDate: 1 }),
    Activity.find({
      companyId: req.user.companyId,
      status: { $ne: "done" },
      dueDate: { $gte: now, $lte: future }
    }).sort({ dueDate: 1 })
  ]);

  res.json({ overdue, upcoming });
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

  const activity = await Activity.create({
    ...req.body,
    companyId: req.user.companyId,
    ownerId: req.user.id
  });
  return res.status(201).json({ activity });
});

router.put("/:id", async (req, res) => {
  const { companyId, ownerId, contactId, ...updates } = req.body;
  const activity = await Activity.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    updates,
    { new: true }
  );

  if (!activity) {
    return res.status(404).json({ message: "Activity not found" });
  }

  return res.json({ activity });
});

router.delete("/:id", requireRole("admin", "manager"), async (req, res) => {
  const activity = await Activity.findOneAndDelete({
    _id: req.params.id,
    companyId: req.user.companyId
  });

  if (!activity) {
    return res.status(404).json({ message: "Activity not found" });
  }

  return res.json({ success: true });
});

module.exports = router;
