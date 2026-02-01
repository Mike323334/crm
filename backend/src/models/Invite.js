const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["admin", "manager", "member"],
      default: "member"
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked"],
      default: "pending"
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

inviteSchema.index({ email: 1, companyId: 1 });

module.exports = mongoose.model("Invite", inviteSchema);
