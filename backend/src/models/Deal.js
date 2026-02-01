const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      required: true
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, default: 0 },
    stage: { type: String, default: "prospecting" },
    status: { type: String, default: "open" },
    probability: { type: Number, default: 0 },
    closeDate: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deal", dealSchema);
