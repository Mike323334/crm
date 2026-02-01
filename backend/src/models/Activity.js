const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
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
    type: { type: String, default: "task" },
    title: { type: String, required: true, trim: true },
    dueDate: { type: Date },
    status: { type: String, default: "open" },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
