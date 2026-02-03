const mongoose = require("mongoose");

const stageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true }
  },
  { _id: true }
);

const pipelineSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    name: { type: String, required: true, trim: true },
    stages: { type: [stageSchema], default: [] }
  },
  { timestamps: true }
);

pipelineSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Pipeline", pipelineSchema);
