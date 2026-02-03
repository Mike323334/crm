const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Attachment = require("../models/Attachment");
const Contact = require("../models/Contact");
const Deal = require("../models/Deal");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(auth);

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${unique}-${safeName}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const toResponse = (attachment) => ({
  ...attachment.toObject(),
  url: `/uploads/${attachment.fileName}`
});

router.get("/", async (req, res) => {
  const query = { companyId: req.user.companyId };
  if (req.query.contactId) {
    query.contactId = req.query.contactId;
  }
  if (req.query.dealId) {
    query.dealId = req.query.dealId;
  }
  const attachments = await Attachment.find(query).sort({ createdAt: -1 });
  res.json({ attachments: attachments.map(toResponse) });
});

router.post("/", upload.single("file"), async (req, res) => {
  const { contactId, dealId } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "File is required" });
  }

  if (!contactId && !dealId) {
    return res.status(400).json({ message: "Contact or deal required" });
  }

  if (contactId) {
    const contact = await Contact.findOne({
      _id: contactId,
      companyId: req.user.companyId
    });
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
  }

  if (dealId) {
    const deal = await Deal.findOne({
      _id: dealId,
      companyId: req.user.companyId
    });
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }
  }

  const attachment = await Attachment.create({
    companyId: req.user.companyId,
    ownerId: req.user.id,
    contactId: contactId || undefined,
    dealId: dealId || undefined,
    originalName: req.file.originalname,
    fileName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size
  });

  return res.status(201).json({ attachment: toResponse(attachment) });
});

router.delete("/:id", async (req, res) => {
  const attachment = await Attachment.findOne({
    _id: req.params.id,
    companyId: req.user.companyId
  });

  if (!attachment) {
    return res.status(404).json({ message: "Attachment not found" });
  }

  const isAdmin =
    req.user.role === "admin" || req.user.role === "manager";
  const isOwner = attachment.ownerId.toString() === req.user.id;
  if (!isAdmin && !isOwner) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const filePath = path.join(uploadsDir, attachment.fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  await attachment.deleteOne();
  return res.json({ success: true });
});

module.exports = router;
