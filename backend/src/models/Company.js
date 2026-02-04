const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, trim: true, lowercase: true },
    domains: [{ type: String, trim: true, lowercase: true }]
  },
  { timestamps: true }
);

companySchema.index({ domain: 1 }, { unique: true });

module.exports = mongoose.model("Company", companySchema);
