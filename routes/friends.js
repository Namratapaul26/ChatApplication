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

// Send friend request
router.post("/request/:id", isAuthenticated, async (req, res) => {
  try {
    const friendId = parseInt(req.params.id);
    const userId = req.user.id;

    if (userId === friendId) {
      return res
        .status(400)
        .json({ error: "Cannot send friend request to yourself" });
    }

    // Check if user exists
    const [userExists] = await pool.execute(
      "SELECT id FROM users WHERE id = ?",
      [friendId]
    );
    if (userExists.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if friendship already exists
    const [existingFriendship] = await pool.execute(
      "SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
      [userId, friendId, friendId, userId]
    );

    if (existingFriendship.length > 0) {
      const status = existingFriendship[0].status;
      if (status === "accepted") {
        return res.status(400).json({ error: "Already friends" });
      } else if (status === "pending") {
        return res.status(400).json({ error: "Friend request already sent" });
      }
    }

    // Insert friend request
    await pool.execute(
      "INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)",
      [userId, friendId, "pending"]
    );

    res.json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.error("Send friend request error:", error);
    res.status(500).json({ error: "Failed to send friend request" });
  }
});

// Accept friend request
router.post("/accept/:id", isAuthenticated, async (req, res) => {
  try {
    const friendId = parseInt(req.params.id);
    const userId = req.user.id;

    // Update the friend request status
    const [result] = await pool.execute(
      "UPDATE friends SET status = ? WHERE user_id = ? AND friend_id = ? AND status = ?",
      ["accepted", friendId, userId, "pending"]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    res.json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Accept friend request error:", error);
    res.status(500).json({ error: "Failed to accept friend request" });
  }
});

// Reject friend request
router.post("/reject/:id", isAuthenticated, async (req, res) => {
  try {
    const friendId = parseInt(req.params.id);
    const userId = req.user.id;

    // Delete the friend request (rejection removes it entirely)
    const [result] = await pool.execute(
      "DELETE FROM friends WHERE user_id = ? AND friend_id = ? AND status = ?",
      [friendId, userId, "pending"]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    res.json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Reject friend request error:", error);
    res.status(500).json({ error: "Failed to reject friend request" });
  }
});

// Get friends list
router.get("/list", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `
            SELECT 
                u.id, u.name, u.email, u.avatar,
                f.status, f.created_at as friendship_date,
                CASE 
                    WHEN f.user_id = ? THEN 'sent'
                    ELSE 'received'
                END as request_type
            FROM friends f
            JOIN users u ON (
                CASE 
                    WHEN f.user_id = ? THEN u.id = f.friend_id
                    ELSE u.id = f.user_id
                END
            )
            WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
            ORDER BY u.name
        `,
      [userId, userId, userId, userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Get friends list error:", error);
    res.status(500).json({ error: "Failed to get friends list" });
  }
});

// Get pending friend requests
router.get("/requests", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get incoming friend requests
    const [incoming] = await pool.execute(
      `
            SELECT 
                u.id, u.name, u.email, u.avatar,
                f.created_at as request_date,
                'incoming' as type
            FROM friends f
            JOIN users u ON u.id = f.user_id
            WHERE f.friend_id = ? AND f.status = 'pending'
            ORDER BY f.created_at DESC
        `,
      [userId]
    );

    // Get outgoing friend requests
    const [outgoing] = await pool.execute(
      `
            SELECT 
                u.id, u.name, u.email, u.avatar,
                f.created_at as request_date,
                'outgoing' as type
            FROM friends f
            JOIN users u ON u.id = f.friend_id
            WHERE f.user_id = ? AND f.status = 'pending'
            ORDER BY f.created_at DESC
        `,
      [userId]
    );

    res.json({
      incoming,
      outgoing,
    });
  } catch (error) {
    console.error("Get friend requests error:", error);
    res.status(500).json({ error: "Failed to get friend requests" });
  }
});

// Remove friend
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const friendId = parseInt(req.params.id);
    const userId = req.user.id;

    // Delete friendship (both directions)
    const [result] = await pool.execute(
      "DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
      [userId, friendId, friendId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Friendship not found" });
    }

    res.json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("Remove friend error:", error);
    res.status(500).json({ error: "Failed to remove friend" });
  }
});

module.exports = router;
