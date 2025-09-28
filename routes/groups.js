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

// Create a new group
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const userId = req.user.id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Group name is required" });
    }

    // Create the group
    const [result] = await pool.execute(
      "INSERT INTO `groups` (name, description, image, created_by) VALUES (?, ?, ?, ?)",
      [name.trim(), description || "", image || "", userId]
    );

    const groupId = result.insertId;

    // Add creator as first member
    await pool.execute(
      "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
      [groupId, userId]
    );

    // Get the created group with member count
    const [groupData] = await pool.execute(
      `
            SELECT 
                g.*,
                u.name as creator_name,
                COUNT(gm.user_id) as member_count
            FROM \`groups\` g
            JOIN users u ON u.id = g.created_by
            LEFT JOIN group_members gm ON gm.group_id = g.id
            WHERE g.id = ?
            GROUP BY g.id
        `,
      [groupId]
    );

    res.status(201).json(groupData[0]);
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Get all groups (public groups that user can join)
router.get("/public", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `
            SELECT 
                g.id, g.name, g.description, g.image,
                u.name as creator_name,
                COUNT(gm.user_id) as member_count,
                MAX(CASE WHEN gm.user_id = ? THEN 1 ELSE 0 END) as is_member
            FROM \`groups\` g
            JOIN users u ON u.id = g.created_by
            LEFT JOIN group_members gm ON gm.group_id = g.id
            GROUP BY g.id
            ORDER BY g.created_at DESC
        `,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Get public groups error:", error);
    res.status(500).json({ error: "Failed to get groups" });
  }
});

// Get user's groups
router.get("/my", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `
            SELECT 
                g.id, g.name, g.description, g.image, g.created_at,
                u.name as creator_name,
                COUNT(gm2.user_id) as member_count,
                gm.joined_at
            FROM group_members gm
            JOIN \`groups\` g ON g.id = gm.group_id
            JOIN users u ON u.id = g.created_by
            LEFT JOIN group_members gm2 ON gm2.group_id = g.id
            WHERE gm.user_id = ?
            GROUP BY g.id, g.name, g.description, g.image, g.created_at, u.name, gm.joined_at
            ORDER BY gm.joined_at DESC
        `,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Get user groups error:", error);
    res.status(500).json({ error: "Failed to get user groups" });
  }
});

// Join a group
router.post("/:id/join", isAuthenticated, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const userId = req.user.id;

    // Check if group exists
    const [groupExists] = await pool.execute(
      "SELECT id FROM `groups` WHERE id = ?",
      [groupId]
    );
    if (groupExists.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is already a member
    const [existingMembership] = await pool.execute(
      "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
      [groupId, userId]
    );

    if (existingMembership.length > 0) {
      return res.status(400).json({ error: "Already a member of this group" });
    }

    // Add user to group
    await pool.execute(
      "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
      [groupId, userId]
    );

    res.json({ message: "Successfully joined group" });
  } catch (error) {
    console.error("Join group error:", error);
    res.status(500).json({ error: "Failed to join group" });
  }
});

// Leave a group
router.post("/:id/leave", isAuthenticated, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const userId = req.user.id;

    // Check if user is a member
    const [membership] = await pool.execute(
      "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
      [groupId, userId]
    );

    if (membership.length === 0) {
      return res.status(400).json({ error: "Not a member of this group" });
    }

    // Check if user is the creator
    const [group] = await pool.execute(
      "SELECT created_by FROM `groups` WHERE id = ?",
      [groupId]
    );
    if (group.length > 0 && group[0].created_by === userId) {
      // Transfer ownership to another member or delete group if no other members
      const [otherMembers] = await pool.execute(
        "SELECT user_id FROM group_members WHERE group_id = ? AND user_id != ? LIMIT 1",
        [groupId, userId]
      );

      if (otherMembers.length > 0) {
        // Transfer ownership to the first other member
        await pool.execute("UPDATE `groups` SET created_by = ? WHERE id = ?", [
          otherMembers[0].user_id,
          groupId,
        ]);
      }
    }

    // Remove user from group
    await pool.execute(
      "DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
      [groupId, userId]
    );

    res.json({ message: "Successfully left group" });
  } catch (error) {
    console.error("Leave group error:", error);
    res.status(500).json({ error: "Failed to leave group" });
  }
});

// Get group details with members
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const userId = req.user.id;

    // Check if user is a member of the group
    const [membership] = await pool.execute(
      "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
      [groupId, userId]
    );

    if (membership.length === 0) {
      return res
        .status(403)
        .json({ error: "Access denied. You are not a member of this group." });
    }

    // Get group details
    const [groupData] = await pool.execute(
      `
            SELECT 
                g.id, g.name, g.description, g.image, g.created_at,
                u.name as creator_name, u.id as creator_id
            FROM \`groups\` g
            JOIN users u ON u.id = g.created_by
            WHERE g.id = ?
        `,
      [groupId]
    );

    if (groupData.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Get group members
    const [members] = await pool.execute(
      `
            SELECT 
                u.id, u.name, u.email, u.avatar,
                gm.joined_at,
                CASE WHEN u.id = ? THEN 1 ELSE 0 END as is_creator
            FROM group_members gm
            JOIN users u ON u.id = gm.user_id
            WHERE gm.group_id = ?
            ORDER BY gm.joined_at ASC
        `,
      [groupData[0].creator_id, groupId]
    );

    res.json({
      ...groupData[0],
      members,
      member_count: members.length,
    });
  } catch (error) {
    console.error("Get group details error:", error);
    res.status(500).json({ error: "Failed to get group details" });
  }
});

// Update group details
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const userId = req.user.id;
    const { name, description, image } = req.body;

    // Check if user is the creator of the group
    const [group] = await pool.execute(
      "SELECT created_by FROM `groups` WHERE id = ?",
      [groupId]
    );

    if (group.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group[0].created_by !== userId) {
      return res
        .status(403)
        .json({ error: "Only group creator can update group details" });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Group name is required" });
    }

    // Update group
    await pool.execute(
      "UPDATE `groups` SET name = ?, description = ?, image = ? WHERE id = ?",
      [name.trim(), description || "", image || "", groupId]
    );

    res.json({ message: "Group updated successfully" });
  } catch (error) {
    console.error("Update group error:", error);
    res.status(500).json({ error: "Failed to update group" });
  }
});

module.exports = router;
