const express = require("express");
const { auth } = require("../middleware/auth");
const Contact = require("../models/Contact");
const Deal = require("../models/Deal");
const Activity = require("../models/Activity");

const router = express.Router();

router.use(auth);

router.get("/", async (req, res) => {
  const companyId = req.user.companyId;
  const [contactsCount, deals, activitiesDue] = await Promise.all([
    Contact.countDocuments({ companyId }),
    Deal.find({ companyId }),
    Activity.countDocuments({
      companyId,
      status: { $ne: "done" },
      dueDate: { $lte: new Date() }
    })
  ]);

  const totalDealValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const openDeals = deals.filter((deal) => deal.status === "open").length;

  res.json({
    stats: {
      contactsCount,
      openDeals,
      totalDealValue,
      activitiesDue
    }
  });
});

module.exports = router;
