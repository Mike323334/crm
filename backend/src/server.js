const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDb = require("./config/db");
const authRoutes = require("./routes/auth");
const contactRoutes = require("./routes/contacts");
const dealRoutes = require("./routes/deals");
const activityRoutes = require("./routes/activities");
const dashboardRoutes = require("./routes/dashboard");
const inviteRoutes = require("./routes/invites");
const pipelineRoutes = require("./routes/pipelines");
const userRoutes = require("./routes/users");
const fileRoutes = require("./routes/files");
const path = require("path");

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: allowedOrigins
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/pipelines", pipelineRoutes);
app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

const start = async () => {
  try {
    await connectDb(process.env.MONGO_URI);
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`API listening on ${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
