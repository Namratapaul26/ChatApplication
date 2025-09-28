const express = require("express");
const multer = require("multer");
const path = require("path");
const { pool } = require("../config/database");
const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/";
    if (file.mimetype.startsWith("image/")) {
      uploadPath += "images/";
    } else if (file.mimetype.startsWith("video/")) {
      uploadPath += "videos/";
    } else if (file.mimetype.startsWith("audio/")) {
      uploadPath += "voice/";
    } else {
      uploadPath += "documents/";
    }

    const fs = require("fs");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes =
      /jpeg|jpg|png|gif|mp4|avi|mov|pdf|doc|docx|txt|mp3|wav|ogg|m4a/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error("Only images, videos, documents, and audio files are allowed")
      );
    }
  },
});

// Send a message
router.post("/", isAuthenticated, upload.single("media"), async (req, res) => {
  try {
    const { content, receiver_id, group_id, is_anonymous } = req.body;
    const userId = req.user.id;

    // Validate message data
    if (!content && !req.file) {
      return res
        .status(400)
        .json({ error: "Message content or media is required" });
    }

    if (!receiver_id && !group_id) {
      return res
        .status(400)
        .json({ error: "Either receiver_id or group_id is required" });
    }

    if (receiver_id && group_id) {
      return res
        .status(400)
        .json({ error: "Cannot send to both individual and group" });
    }

    let mediaUrl = null;
    let voiceUrl = null;
    let mediaType = null;

    if (req.file) {
      const filePath = req.file.path.replace(/\\/g, "/");
      if (req.file.mimetype.startsWith("audio/")) {
        voiceUrl = filePath;
        mediaType = "voice";
      } else {
        mediaUrl = filePath;
        if (req.file.mimetype.startsWith("image/")) {
          mediaType = "image";
        } else if (req.file.mimetype.startsWith("video/")) {
          mediaType = "video";
        } else {
          mediaType = "document";
        }
      }
    }

    // If it's a direct message, check if users are friends
    if (receiver_id) {
      const [friendship] = await pool.execute(
        `SELECT id FROM friends 
                 WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
                 AND status = 'accepted'`,
        [userId, receiver_id, receiver_id, userId]
      );

      if (friendship.length === 0) {
        return res
          .status(403)
          .json({ error: "Can only send messages to accepted friends" });
      }
    }

    // If it's a group message, check if user is a member
    if (group_id) {
      const [membership] = await pool.execute(
        "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
        [group_id, userId]
      );

      if (membership.length === 0) {
        return res
          .status(403)
          .json({ error: "You are not a member of this group" });
      }
    }

    // Insert message
    const [result] = await pool.execute(
      `INSERT INTO messages 
             (sender_id, receiver_id, group_id, content, media_url, voice_url, media_type, is_anonymous) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        receiver_id || null,
        group_id || null,
        content || "",
        mediaUrl,
        voiceUrl,
        mediaType,
        is_anonymous === "true" || is_anonymous === true,
      ]
    );

    // Get the complete message with sender info
    const [messageData] = await pool.execute(
      `
            SELECT 
                m.*,
                u.name as sender_name,
                u.avatar as sender_avatar
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            WHERE m.id = ?
        `,
      [result.insertId]
    );

    res.status(201).json(messageData[0]);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get messages for a chat (either direct message or group)
router.get("/:chatId", isAuthenticated, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { type, page = 1, limit = 50 } = req.query;
    const userId = req.user.id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    console.log("Get messages params:", {
      chatId,
      type,
      page,
      limit,
      userId,
      offset,
    });

    let messages = [];

    if (type === "direct") {
      // Check if users are friends
      const [friendship] = await pool.execute(
        `SELECT id FROM friends 
                 WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
                 AND status = 'accepted'`,
        [userId, parseInt(chatId), parseInt(chatId), userId]
      );

      if (friendship.length === 0) {
        return res
          .status(403)
          .json({ error: "Can only view messages with accepted friends" });
      }

      // Get direct messages
      console.log("About to execute direct messages query with params:", [
        userId,
        parseInt(chatId),
        parseInt(chatId),
        userId,
        parseInt(limit),
        offset,
      ]);
      console.log(
        "Parameter types:",
        typeof userId,
        typeof parseInt(chatId),
        typeof parseInt(limit),
        typeof offset
      );

      // Validate parameters before executing
      const params = [
        userId,
        parseInt(chatId),
        parseInt(chatId),
        userId,
        parseInt(limit),
        offset,
      ];
      console.log("Final params array:", params, "Length:", params.length);

      // Check if any parameters are NaN or invalid
      for (let i = 0; i < params.length; i++) {
        if (
          params[i] === null ||
          params[i] === undefined ||
          (typeof params[i] === "number" && isNaN(params[i]))
        ) {
          console.error(`Invalid parameter at index ${i}:`, params[i]);
          return res.status(400).json({ error: "Invalid parameters" });
        }
      }

      // Try a simple query first to test if tables exist
      console.log("Testing basic queries...");

      try {
        // Test 1: Basic table existence
        const [testMessages] = await pool.execute(
          "SELECT COUNT(*) as count FROM messages"
        );
        console.log("Messages table test:", testMessages);

        // Test 2: Basic user table
        const [testUsers] = await pool.execute(
          "SELECT COUNT(*) as count FROM users"
        );
        console.log("Users table test:", testUsers);

        // Test 3: Simple parameterized query
        const [testParam] = await pool.execute("SELECT ? as test_param", [
          userId,
        ]);
        console.log("Parameter test:", testParam);

        // Test 4: Check table structure
        const [tableStructure] = await pool.execute("DESCRIBE messages");
        console.log("Messages table structure:", tableStructure);

        // Test 5: Try basic SELECT on messages
        const [basicSelect] = await pool.execute(
          "SELECT * FROM messages LIMIT 2"
        );
        console.log("Basic messages select:", basicSelect);
      } catch (testErr) {
        console.error("Basic table tests failed:", testErr);
        return res.status(500).json({ error: "Database table issues" });
      }

      // Try simplified query first
      console.log("Trying simplified query without JOIN...");

      // Test with just WHERE clause, no LIMIT/OFFSET
      try {
        console.log("Step 1: Testing WHERE clause only");
        const [step1] = await pool.execute(
          "SELECT * FROM messages WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))",
          [userId, parseInt(chatId), parseInt(chatId), userId]
        );
        console.log("Step 1 succeeded, rows:", step1.length);

        // Test with ORDER BY
        console.log("Step 2: Testing with ORDER BY");
        const [step2] = await pool.execute(
          "SELECT * FROM messages WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) ORDER BY timestamp DESC",
          [userId, parseInt(chatId), parseInt(chatId), userId]
        );
        console.log("Step 2 succeeded, rows:", step2.length);

        // Test with LIMIT only
        console.log("Step 3: Testing with LIMIT using string interpolation");
        const [step3] = await pool.execute(
          `SELECT * FROM messages WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) ORDER BY timestamp DESC LIMIT ${parseInt(
            limit
          )}`,
          [userId, parseInt(chatId), parseInt(chatId), userId]
        );
        console.log("Step 3 succeeded, rows:", step3.length);
      } catch (stepErr) {
        console.error("Step-by-step test failed at:", stepErr.message);
      }

      const [simpleRows] = await pool.execute(
        `SELECT * FROM messages WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) ORDER BY timestamp DESC LIMIT ${parseInt(
          limit
        )} OFFSET ${offset}`,
        [userId, parseInt(chatId), parseInt(chatId), userId]
      );

      console.log("Simple query succeeded, rows:", simpleRows.length);

      // If simple query works, try with JOIN
      const [rows] = await pool.execute(
        `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar FROM messages m JOIN users u ON u.id = m.sender_id WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)) ORDER BY m.timestamp DESC LIMIT ${parseInt(
          limit
        )} OFFSET ${offset}`,
        [userId, parseInt(chatId), parseInt(chatId), userId]
      );

      messages = rows;

      // Mark messages as read
      await pool.execute(
        "UPDATE messages SET is_read = true WHERE receiver_id = ? AND sender_id = ? AND is_read = false",
        [userId, parseInt(chatId)]
      );
    } else if (type === "group") {
      // Check if user is a group member
      const [membership] = await pool.execute(
        "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
        [parseInt(chatId), userId]
      );

      if (membership.length === 0) {
        return res
          .status(403)
          .json({ error: "You are not a member of this group" });
      }

      // Get group messages
      const [rows] = await pool.execute(
        `SELECT 
                    m.*,
                    u.name as sender_name,
                    u.avatar as sender_avatar,
                    g.name as group_name
                FROM messages m
                JOIN users u ON u.id = m.sender_id
                JOIN \`groups\` g ON g.id = m.group_id
                WHERE m.group_id = ?
                ORDER BY m.timestamp DESC
                LIMIT ${parseInt(limit)} OFFSET ${offset}`,
        [parseInt(chatId)]
      );
      messages = rows;
    } else {
      return res
        .status(400)
        .json({ error: 'Invalid chat type. Must be "direct" or "group"' });
    }

    // Reverse to show oldest first
    messages.reverse();

    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// Get unread message count
router.get("/unread/count", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get unread direct messages count
    const [directUnread] = await pool.execute(
      `
            SELECT 
                m.sender_id,
                u.name as sender_name,
                u.avatar as sender_avatar,
                COUNT(*) as unread_count
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            WHERE m.receiver_id = ? AND m.is_read = false
            GROUP BY m.sender_id, u.name, u.avatar
        `,
      [userId]
    );

    // Get unread group messages count (simplified - just total count)
    const [groupUnread] = await pool.execute(
      `
            SELECT 
                g.id as group_id,
                g.name as group_name,
                COUNT(*) as unread_count
            FROM messages m
            JOIN \`groups\` g ON g.id = m.group_id
            JOIN group_members gm ON gm.group_id = g.id
            WHERE gm.user_id = ? AND m.sender_id != ? AND m.timestamp > gm.joined_at
            GROUP BY g.id, g.name
        `,
      [userId, userId]
    );
    res.json({
      direct: directUnread,
      groups: groupUnread,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
});

// Mark messages as read
router.post("/mark-read", isAuthenticated, async (req, res) => {
  try {
    const { sender_id } = req.body;
    const userId = req.user.id;

    if (!sender_id) {
      return res.status(400).json({ error: "sender_id is required" });
    }

    await pool.execute(
      "UPDATE messages SET is_read = true WHERE receiver_id = ? AND sender_id = ?",
      [userId, sender_id]
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Mark messages as read error:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

module.exports = router;
