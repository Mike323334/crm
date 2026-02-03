const express = require("express");
const Pipeline = require("../models/Pipeline");
const Deal = require("../models/Deal");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/", async (req, res) => {
  const pipelines = await Pipeline.find({ companyId: req.user.companyId }).sort({
    createdAt: 1
  });
  res.json({ pipelines });
});

router.post("/", requireRole("admin"), async (req, res) => {
  const { name, stages } = req.body;
  if (!name || !Array.isArray(stages) || stages.length === 0) {
    return res.status(400).json({ message: "Name and stages required" });
  }

  const normalizedStages = stages
    .map((stage, index) => ({
      name: stage.name?.trim(),
      order: stage.order ?? index
    }))
    .filter((stage) => stage.name);

  if (normalizedStages.length === 0) {
    return res.status(400).json({ message: "Stages required" });
  }

  const pipeline = await Pipeline.create({
    companyId: req.user.companyId,
    name: name.trim(),
    stages: normalizedStages
  });

  return res.status(201).json({ pipeline });
});

router.put("/:id", requireRole("admin"), async (req, res) => {
  const { name, stages } = req.body;
  const updates = {};
  if (name) {
    updates.name = name.trim();
  }
  if (Array.isArray(stages)) {
    updates.stages = stages
      .map((stage, index) => ({
        _id: stage._id,
        name: stage.name?.trim(),
        order: stage.order ?? index
      }))
      .filter((stage) => stage.name);
  }

  const pipeline = await Pipeline.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    updates,
    { new: true }
  );

  if (!pipeline) {
    return res.status(404).json({ message: "Pipeline not found" });
  }

  return res.json({ pipeline });
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  const pipeline = await Pipeline.findOne({
    _id: req.params.id,
    companyId: req.user.companyId
  });
  if (!pipeline) {
    return res.status(404).json({ message: "Pipeline not found" });
  }

  const dealsCount = await Deal.countDocuments({
    pipelineId: pipeline._id,
    companyId: req.user.companyId
  });
  if (dealsCount > 0) {
    return res
      .status(409)
      .json({ message: "Pipeline has deals attached" });
  }

  await pipeline.deleteOne();
  return res.json({ success: true });
});

router.get("/:id/analytics", async (req, res) => {
  const pipeline = await Pipeline.findOne({
    _id: req.params.id,
    companyId: req.user.companyId
  });
  if (!pipeline) {
    return res.status(404).json({ message: "Pipeline not found" });
  }

  const deals = await Deal.find({
    pipelineId: pipeline._id,
    companyId: req.user.companyId
  }).select("status stageHistory");

  const won = deals.filter((deal) => deal.status === "won").length;
  const lost = deals.filter((deal) => deal.status === "lost").length;
  const totalClosed = won + lost;
  const winRate = totalClosed === 0 ? 0 : (won / totalClosed) * 100;

  const stageTotals = new Map();
  const stageCounts = new Map();
  const now = new Date();

  deals.forEach((deal) => {
    deal.stageHistory.forEach((entry) => {
      const exit = entry.exitedAt || now;
      const durationMs = Math.max(exit - entry.enteredAt, 0);
      const key = entry.stageId.toString();
      stageTotals.set(key, (stageTotals.get(key) || 0) + durationMs);
      stageCounts.set(key, (stageCounts.get(key) || 0) + 1);
    });
  });

  const perStageAvgDays = pipeline.stages.map((stage) => {
    const total = stageTotals.get(stage._id.toString()) || 0;
    const count = stageCounts.get(stage._id.toString()) || 0;
    const avgMs = count === 0 ? 0 : total / count;
    return {
      stageId: stage._id,
      stageName: stage.name,
      avgDays: Number((avgMs / (1000 * 60 * 60 * 24)).toFixed(2))
    };
  });

  res.json({
    analytics: {
      winRate: Number(winRate.toFixed(2)),
      perStageAvgDays
    }
  });
});

module.exports = router;
