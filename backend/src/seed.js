const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User");
const Contact = require("./models/Contact");
const Deal = require("./models/Deal");
const Activity = require("./models/Activity");
const Company = require("./models/Company");
const Invite = require("./models/Invite");

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/crm_dev";

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected for seeding...");

    await Promise.all([
      User.deleteMany(),
      Contact.deleteMany(),
      Deal.deleteMany(),
      Activity.deleteMany(),
      Company.deleteMany(),
      Invite.deleteMany()
    ]);

    const company = await Company.create({
      name: "Demo Company",
      domain: "crm.com"
    });
    const user = await User.create({
      email: "demo@crm.com",
      password: "123456",
      companyId: company._id,
      role: "admin"
    });

    console.log("User created");

    const contacts = await Contact.insertMany([
      {
        companyId: company._id,
        ownerId: user._id,
        firstName: "John",
        lastName: "Carter",
        email: "john@company.com",
        phone: "555-1234",
        company: "Carter Solutions",
        status: "lead",
        tags: ["inbound", "web"],
        notes: "Interested in website redesign"
      },
      {
        companyId: company._id,
        ownerId: user._id,
        firstName: "Maria",
        lastName: "Lopez",
        email: "maria@marketingpro.com",
        phone: "555-5678",
        company: "Marketing Pro",
        status: "prospect",
        tags: ["marketing"],
        notes: "Asked for pricing details"
      },
      {
        companyId: company._id,
        ownerId: user._id,
        firstName: "David",
        lastName: "Kim",
        email: "david@techworld.com",
        phone: "555-8765",
        company: "TechWorld",
        status: "customer",
        tags: ["enterprise"],
        notes: "Signed contract last month"
      }
    ]);

    console.log("Contacts created");

    await Deal.insertMany([
      {
        companyId: company._id,
        ownerId: user._id,
        contactId: contacts[0]._id,
        title: "Website Redesign",
        amount: 2500,
        stage: "proposal",
        status: "open",
        probability: 40,
        closeDate: new Date("2026-02-15")
      },
      {
        companyId: company._id,
        ownerId: user._id,
        contactId: contacts[1]._id,
        title: "SEO Optimization",
        amount: 1200,
        stage: "negotiation",
        status: "open",
        probability: 60,
        closeDate: new Date("2026-02-10")
      },
      {
        companyId: company._id,
        ownerId: user._id,
        contactId: contacts[2]._id,
        title: "Mobile App Development",
        amount: 8000,
        stage: "won",
        status: "won",
        probability: 100,
        closeDate: new Date("2026-01-20")
      }
    ]);

    console.log("Deals created");

    await Activity.insertMany([
      {
        companyId: company._id,
        ownerId: user._id,
        contactId: contacts[0]._id,
        type: "call",
        title: "Discovery call",
        dueDate: new Date(),
        status: "done",
        notes: "Discussed project requirements"
      },
      {
        companyId: company._id,
        ownerId: user._id,
        contactId: contacts[1]._id,
        type: "email",
        title: "Send pricing brochure",
        dueDate: new Date(),
        status: "done",
        notes: "Sent pricing brochure"
      },
      {
        companyId: company._id,
        ownerId: user._id,
        contactId: contacts[2]._id,
        type: "meeting",
        title: "Kickoff meeting",
        dueDate: new Date(),
        status: "done",
        notes: "Kickoff meeting completed"
      },
      {
        companyId: company._id,
        ownerId: user._id,
        contactId: contacts[2]._id,
        type: "task",
        title: "Prepare Q1 roadmap",
        dueDate: new Date(),
        status: "open",
        notes: "Client wants visibility on milestones"
      }
    ]);

    console.log("Activities created");
    console.log("Database seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
