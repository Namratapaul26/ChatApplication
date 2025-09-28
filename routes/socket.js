const { pool } = require("../config/database");

// Store active connections
const activeUsers = new Map(); // userId -> { socketId, userData }
const userSockets = new Map(); // socketId -> userId

const handleSocketConnection = (io, socket) => {
  console.log("User connected:", socket.id);

  // Handle user authentication for socket
  socket.on("authenticate", async (data) => {
    try {
      const { userId } = data;

      if (!userId) {
        socket.emit("auth_error", { message: "User ID required" });
        return;
      }

      // Get user data
      const [users] = await pool.execute("SELECT * FROM users WHERE id = ?", [
        userId,
      ]);
      if (users.length === 0) {
        socket.emit("auth_error", { message: "User not found" });
        return;
      }

      const user = users[0];

      // Store user connection
      activeUsers.set(userId, {
        socketId: socket.id,
        userData: user,
        lastSeen: new Date(),
      });
      userSockets.set(socket.id, userId);

      // Update online status in database
      await pool.execute(
        "INSERT INTO online_users (user_id, socket_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE socket_id = ?, last_seen = CURRENT_TIMESTAMP",
        [userId, socket.id, socket.id]
      );

      // Join user to their personal room
      socket.join(`user_${userId}`);

      // Join user to their group rooms
      const [groups] = await pool.execute(
        `
                SELECT g.id FROM \`groups\` g
                JOIN group_members gm ON gm.group_id = g.id
                WHERE gm.user_id = ?
            `,
        [userId]
      );

      groups.forEach((group) => {
        socket.join(`group_${group.id}`);
      });

      // Notify friends that user is online
      const [friends] = await pool.execute(
        `
                SELECT 
                    CASE 
                        WHEN f.user_id = ? THEN f.friend_id
                        ELSE f.user_id
                    END as friend_id
                FROM friends f
                WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
            `,
        [userId, userId, userId]
      );

      friends.forEach((friend) => {
        socket.to(`user_${friend.friend_id}`).emit("user_online", {
          userId: userId,
          name: user.name,
          avatar: user.avatar,
        });
      });

      socket.emit("authenticated", { message: "Successfully authenticated" });
      console.log(`User ${user.name} authenticated with socket ${socket.id}`);
    } catch (error) {
      console.error("Authentication error:", error);
      socket.emit("auth_error", { message: "Authentication failed" });
    }
  });

  // Handle sending messages
  socket.on("send_message", async (data) => {
    try {
      const userId = userSockets.get(socket.id);
      if (!userId) {
        socket.emit("error", { message: "Not authenticated" });
        return;
      }

      const {
        content,
        receiver_id,
        group_id,
        is_anonymous,
        media_url,
        voice_url,
        media_type,
      } = data;

      // Validate message data
      if (!content && !media_url && !voice_url) {
        socket.emit("error", {
          message: "Message content or media is required",
        });
        return;
      }

      if (!receiver_id && !group_id) {
        socket.emit("error", {
          message: "Either receiver_id or group_id is required",
        });
        return;
      }

      // Insert message into database
      const [result] = await pool.execute(
        `INSERT INTO messages 
                 (sender_id, receiver_id, group_id, content, media_url, voice_url, media_type, is_anonymous) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          receiver_id || null,
          group_id || null,
          content || "",
          media_url || null,
          voice_url || null,
          media_type || null,
          is_anonymous || false,
        ]
      );

      // Get complete message data
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

      const message = messageData[0];

      if (receiver_id) {
        // Direct message - send to both sender and receiver
        socket.to(`user_${receiver_id}`).emit("new_message", message);
        socket.emit("new_message", message); // Also send to sender
      } else if (group_id) {
        // Group message - send to all group members including sender
        socket.to(`group_${group_id}`).emit("new_message", message);
        socket.emit("new_message", message); // Also send to sender
      }
    } catch (error) {
      console.error("Send message error:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Handle typing indicators
  socket.on("typing_start", (data) => {
    const userId = userSockets.get(socket.id);
    if (!userId) return;

    const { receiver_id, group_id } = data;
    const userInfo = activeUsers.get(userId);

    if (receiver_id) {
      socket.to(`user_${receiver_id}`).emit("typing_start", {
        userId: userId,
        name: userInfo?.userData.name,
        avatar: userInfo?.userData.avatar,
      });
    } else if (group_id) {
      socket.to(`group_${group_id}`).emit("typing_start", {
        userId: userId,
        name: userInfo?.userData.name,
        avatar: userInfo?.userData.avatar,
        groupId: group_id,
      });
    }
  });

  socket.on("typing_stop", (data) => {
    const userId = userSockets.get(socket.id);
    if (!userId) return;

    const { receiver_id, group_id } = data;

    if (receiver_id) {
      socket.to(`user_${receiver_id}`).emit("typing_stop", { userId: userId });
    } else if (group_id) {
      socket.to(`group_${group_id}`).emit("typing_stop", {
        userId: userId,
        groupId: group_id,
      });
    }
  });

  // Handle read receipts
  socket.on("message_read", async (data) => {
    try {
      const userId = userSockets.get(socket.id);
      if (!userId) return;

      const { message_id, sender_id } = data;

      // Update message as read
      await pool.execute(
        "UPDATE messages SET is_read = true WHERE id = ? AND receiver_id = ?",
        [message_id, userId]
      );

      // Notify sender that message was read
      socket.to(`user_${sender_id}`).emit("message_read", {
        message_id: message_id,
        reader_id: userId,
        read_at: new Date(),
      });
    } catch (error) {
      console.error("Message read error:", error);
    }
  });

  // Handle joining group rooms when user joins a new group
  socket.on("join_group", (data) => {
    const { group_id } = data;
    socket.join(`group_${group_id}`);
  });

  // Handle leaving group rooms
  socket.on("leave_group", (data) => {
    const { group_id } = data;
    socket.leave(`group_${group_id}`);
  });

  // Handle getting online users
  socket.on("get_online_users", async () => {
    try {
      const userId = userSockets.get(socket.id);
      if (!userId) return;

      // Get user's friends who are online
      const [onlineFriends] = await pool.execute(
        `
                SELECT 
                    u.id, u.name, u.avatar,
                    ou.last_seen
                FROM friends f
                JOIN users u ON (
                    CASE 
                        WHEN f.user_id = ? THEN u.id = f.friend_id
                        ELSE u.id = f.user_id
                    END
                )
                JOIN online_users ou ON ou.user_id = u.id
                WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
                AND ou.last_seen > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            `,
        [userId, userId, userId]
      );

      socket.emit("online_users", onlineFriends);
    } catch (error) {
      console.error("Get online users error:", error);
    }
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    try {
      const userId = userSockets.get(socket.id);

      if (userId) {
        const userInfo = activeUsers.get(userId);

        // Remove from active users
        activeUsers.delete(userId);
        userSockets.delete(socket.id);

        // Update offline status in database
        await pool.execute("DELETE FROM online_users WHERE socket_id = ?", [
          socket.id,
        ]);

        // Notify friends that user went offline
        if (userInfo) {
          const [friends] = await pool.execute(
            `
                        SELECT 
                            CASE 
                                WHEN f.user_id = ? THEN f.friend_id
                                ELSE f.user_id
                            END as friend_id
                        FROM friends f
                        WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
                    `,
            [userId, userId, userId]
          );

          friends.forEach((friend) => {
            socket.to(`user_${friend.friend_id}`).emit("user_offline", {
              userId: userId,
              name: userInfo.userData.name,
              avatar: userInfo.userData.avatar,
            });
          });
        }
      }
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  });
};

// Function to get active users (for API endpoints)
const getActiveUsers = () => {
  return Array.from(activeUsers.entries()).map(([userId, data]) => ({
    userId: parseInt(userId),
    ...data.userData,
    lastSeen: data.lastSeen,
  }));
};

// Function to check if user is online
const isUserOnline = (userId) => {
  return activeUsers.has(userId);
};

module.exports = {
  handleSocketConnection,
  getActiveUsers,
  isUserOnline,
};
