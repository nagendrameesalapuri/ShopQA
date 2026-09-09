const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { connectDB } = require("./config/database");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// The API runs behind a reverse proxy in production (for example Nginx or a
// hosting-provider load balancer). Trust only the closest proxy so `req.ip`
// remains the real client IP for rate limiting and audit records.
const trustProxy = process.env.TRUST_PROXY;
app.set("trust proxy", trustProxy === undefined ? 1 : /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy === "true");

// ─── Security & Middleware ────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
const allowedOrigins = [
  "http://localhost:3000",
  "https://nagendra-shopqa.netlify.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors((req, callback) => {
    const origin = req.get("Origin");
    // Swagger is served from this API, so its same-origin requests must be
    // allowed as well. `trust proxy` above preserves the public HTTPS scheme.
    const apiOrigin = `${req.protocol}://${req.get("host")}`;

    if (!origin || allowedOrigins.includes(origin) || origin === apiOrigin) {
      callback(null, { origin: true, credentials: true });
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Static File Serving for Uploads ─────────────────────────────────────────
const uploadsDir = path.join(__dirname, "../uploads/products");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads/products directory");
}
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "../uploads")),
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const positiveIntegerEnv = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const limiter = rateLimit({
  windowMs: positiveIntegerEnv("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  // This is per client IP (not a shared proxy IP). Keep the default generous
  // for normal storefront traffic while account lockout still protects login.
  max: positiveIntegerEnv("RATE_LIMIT_MAX", 1000),
  message: {
    error: "Too many requests, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/users", require("./routes/users"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/coupons", require("./routes/coupons"));
app.use("/api/qa", require("./routes/qa"));

// ─── Swagger Docs ─────────────────────────────────────────────────────────────
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "ShopQA API Documentation",
  }),
);
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) =>
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  }),
);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
    code: err.code || "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.use("*", (req, res) =>
  res.status(404).json({ error: "Route not found", code: "NOT_FOUND" }),
);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 ShopQA API running on port ${PORT}`);
    console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  });
};

start().catch(console.error);

module.exports = app;
