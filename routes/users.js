const express = require("express");
const { pool } = require("../config/database");
const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

// Search users by name or email
router.get("/search", isAuthenticated, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const [rows] = await pool.execute(
      `SELECT id, name, email, avatar 
             FROM users 
             WHERE (name LIKE ? OR email LIKE ?) AND id != ?
             LIMIT 20`,
      [`%${q}%`, `%${q}%`, req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

// Get user profile
router.get("/profile/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      "SELECT id, name, email, avatar, created_at FROM users WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// Get current user's profile
router.get("/me", isAuthenticated, (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    avatar: req.user.avatar,
    created_at: req.user.created_at,
  });
});

// Update user profile
router.put("/me", isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }

    await pool.execute("UPDATE users SET name = ? WHERE id = ?", [
      name.trim(),
      req.user.id,
    ]);

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;
