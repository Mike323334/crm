const express = require("express");
const Deal = require("../models/Deal");
const Contact = require("../models/Contact");
const Pipeline = require("../models/Pipeline");
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
  const { contactId, pipelineId, stageId } = req.body;
  const contact = await Contact.findOne({
    _id: contactId,
    companyId: req.user.companyId
  });

  if (!contact) {
    return res.status(404).json({ message: "Contact not found" });
  }

  let pipeline = null;
  if (pipelineId) {
    pipeline = await Pipeline.findOne({
      _id: pipelineId,
      companyId: req.user.companyId
    });
  } else {
    pipeline = await Pipeline.findOne({ companyId: req.user.companyId }).sort({
      createdAt: 1
    });
  }

  if (!pipeline) {
    return res.status(400).json({ message: "Pipeline required" });
  }

  const resolvedStageId =
    stageId || (pipeline.stages[0] && pipeline.stages[0]._id);
  const stageExists = pipeline.stages.some(
    (stage) => stage._id.toString() === resolvedStageId?.toString()
  );
  if (!resolvedStageId || !stageExists) {
    return res.status(400).json({ message: "Invalid stage" });
  }

  const deal = await Deal.create({
    ...req.body,
    companyId: req.user.companyId,
    ownerId: req.user.id,
    pipelineId: pipeline._id,
    stageId: resolvedStageId,
    stageHistory: [{ stageId: resolvedStageId, enteredAt: new Date() }]
  });
  return res.status(201).json({ deal });
});

router.put("/:id", async (req, res) => {
  const { companyId, ownerId, contactId, pipelineId, ...updates } = req.body;
  const deal = await Deal.findOne({
    _id: req.params.id,
    companyId: req.user.companyId
  });

  if (!deal) {
    return res.status(404).json({ message: "Deal not found" });
  }

  if (updates.stageId) {
    const pipeline = await Pipeline.findOne({
      _id: deal.pipelineId,
      companyId: req.user.companyId
    });
    const stageExists = pipeline?.stages.some(
      (stage) => stage._id.toString() === updates.stageId.toString()
    );
    if (!stageExists) {
      return res.status(400).json({ message: "Invalid stage" });
    }
  }

  if (updates.stageId && updates.stageId.toString() !== deal.stageId.toString()) {
    const now = new Date();
    const last = deal.stageHistory[deal.stageHistory.length - 1];
    if (last && !last.exitedAt) {
      last.exitedAt = now;
    }
    deal.stageHistory.push({ stageId: updates.stageId, enteredAt: now });
  }

  Object.assign(deal, updates);
  await deal.save();

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
