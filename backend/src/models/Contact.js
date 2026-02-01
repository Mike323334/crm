const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    title: { type: String, trim: true },
    status: { type: String, default: "lead" },
    tags: [{ type: String }],
    notes: { type: String, trim: true },
    address: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);
