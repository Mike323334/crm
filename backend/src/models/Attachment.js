const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact" },
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: "Deal" },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attachment", attachmentSchema);
