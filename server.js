const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const session = require("express-session");
const passport = require("./config/passport");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { testConnection, initDatabase } = require("./config/database");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const friendRoutes = require("./routes/friends");
const groupRoutes = require("./routes/groups");
const messageRoutes = require("./routes/messages");

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.BASE_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for development
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit for chat app - 1000 requests per 15 minutes
  message: "Too many requests, please try again later.",
  // Skip rate limiting for Socket.IO
  skip: (req) => req.path.startsWith("/socket.io/"),
});
app.use(limiter);

// CORS
app.use(
  cors({
    origin: process.env.BASE_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Make user available to all routes
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/messages", messageRoutes);

// Main route - serve the chat application
app.get("/", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.sendFile(path.join(__dirname, "public", "login.html"));
  }
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// Socket.IO connection handling
const { handleSocketConnection } = require("./routes/socket");
io.on("connection", (socket) => {
  handleSocketConnection(io, socket);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await testConnection();
    await initDatabase();

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log("📱 Chat application is ready!");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
