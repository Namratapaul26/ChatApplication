// Main chat application JavaScript
class ChatApp {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.currentChat = null;
    this.currentChatType = null; // 'direct' or 'group'
    this.isAnonymous = false;
    this.typingTimeout = null;

    this.init();
  }

  async init() {
    try {
      // Check authentication status
      await this.checkAuth();

      // Initialize socket connection
      this.initSocket();

      // Load initial data
      await this.loadInitialData();

      // Set up event listeners
      this.setupEventListeners();

      console.log("Chat app initialized successfully");
    } catch (error) {
      console.error("Failed to initialize chat app:", error);
      window.location.href = "/";
    }
  }

  async checkAuth() {
    try {
      const response = await fetch("/auth/status");
      const data = await response.json();

      if (!data.authenticated) {
        throw new Error("Not authenticated");
      }

      this.currentUser = data.user;
      this.updateUserProfile();
    } catch (error) {
      console.error("Authentication check failed:", error);
      throw error;
    }
  }

  updateUserProfile() {
    const avatarEl = document.getElementById("current-user-avatar");
    const nameEl = document.getElementById("current-user-name");

    if (avatarEl) avatarEl.src = this.currentUser.avatar;
    if (nameEl) nameEl.textContent = this.currentUser.name;
  }

  initSocket() {
    this.socket = io();

    // Authenticate with socket
    this.socket.on("connect", () => {
      console.log("Socket connected");
      this.socket.emit("authenticate", { userId: this.currentUser.id });
    });

    this.socket.on("authenticated", () => {
      console.log("Socket authenticated");
    });

    this.socket.on("auth_error", (data) => {
      console.error("Socket authentication error:", data.message);
    });

    // Handle incoming messages
    this.socket.on("new_message", (message) => {
      this.handleNewMessage(message);
    });

    // Handle typing indicators
    this.socket.on("typing_start", (data) => {
      this.showTypingIndicator(data);
    });

    this.socket.on("typing_stop", (data) => {
      this.hideTypingIndicator(data);
    });

    // Handle online/offline status
    this.socket.on("user_online", (data) => {
      this.updateUserStatus(data.userId, true);
    });

    this.socket.on("user_offline", (data) => {
      this.updateUserStatus(data.userId, false);
    });

    // Handle message read receipts
    this.socket.on("message_read", (data) => {
      this.updateMessageStatus(data.message_id, "read");
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  }

  async loadInitialData() {
    try {
      // Load friends and friend requests
      await this.loadFriends();
      await this.loadFriendRequests();

      // Load groups
      await this.loadMyGroups();

      // Load recent chats
      await this.loadRecentChats();
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  }

  async loadFriends() {
    try {
      const response = await fetch("/api/friends/list");
      const friends = await response.json();

      const friendsList = document.getElementById("friends-list");
      if (!friendsList) return;

      friendsList.innerHTML = "";

      if (friends.length === 0) {
        friendsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-user-friends"></i>
                        <h3>No Friends Yet</h3>
                        <p>Search for users to add friends</p>
                    </div>
                `;
        return;
      }

      friends.forEach((friend) => {
        const friendElement = this.createFriendElement(friend);
        friendsList.appendChild(friendElement);
      });
    } catch (error) {
      console.error("Failed to load friends:", error);
    }
  }

  async loadFriendRequests() {
    try {
      const response = await fetch("/api/friends/requests");
      const data = await response.json();

      const requestsList = document.getElementById("friend-requests");
      if (!requestsList) return;

      requestsList.innerHTML = "";

      if (data.incoming.length === 0 && data.outgoing.length === 0) {
        requestsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-envelope"></i>
                        <h3>No Pending Requests</h3>
                        <p>Friend requests will appear here</p>
                    </div>
                `;
        return;
      }

      // Show incoming requests
      data.incoming.forEach((request) => {
        const requestElement = this.createFriendRequestElement(
          request,
          "incoming"
        );
        requestsList.appendChild(requestElement);
      });

      // Show outgoing requests
      data.outgoing.forEach((request) => {
        const requestElement = this.createFriendRequestElement(
          request,
          "outgoing"
        );
        requestsList.appendChild(requestElement);
      });

      // Update badge
      this.updateFriendsBadge(data.incoming.length);
    } catch (error) {
      console.error("Failed to load friend requests:", error);
    }
  }

  async loadMyGroups() {
    try {
      const response = await fetch("/api/groups/my");
      const groups = await response.json();

      const groupsList = document.getElementById("my-groups-list");
      if (!groupsList) return;

      groupsList.innerHTML = "";

      if (groups.length === 0) {
        groupsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No Groups Yet</h3>
                        <p>Create or join groups to get started</p>
                    </div>
                `;
        return;
      }

      groups.forEach((group) => {
        const groupElement = this.createGroupElement(group, true);
        groupsList.appendChild(groupElement);
      });
    } catch (error) {
      console.error("Failed to load groups:", error);
    }
  }

  async loadRecentChats() {
    try {
      // For now, we'll populate chats from friends and groups
      const chatList = document.getElementById("chat-list");
      if (!chatList) return;

      chatList.innerHTML = "";

      // Add friends as direct chats
      const friendsResponse = await fetch("/api/friends/list");
      const friends = await friendsResponse.json();

      friends.forEach((friend) => {
        const chatElement = this.createChatElement(friend, "direct");
        chatList.appendChild(chatElement);
      });

      // Add groups as group chats
      const groupsResponse = await fetch("/api/groups/my");
      const groups = await groupsResponse.json();

      groups.forEach((group) => {
        const chatElement = this.createChatElement(group, "group");
        chatList.appendChild(chatElement);
      });

      if (friends.length === 0 && groups.length === 0) {
        chatList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-comments"></i>
                        <h3>No Chats Yet</h3>
                        <p>Add friends or join groups to start chatting</p>
                    </div>
                `;
      }
    } catch (error) {
      console.error("Failed to load recent chats:", error);
    }
  }

  createFriendElement(friend) {
    const div = document.createElement("div");
    div.className = "friend-item";
    div.innerHTML = `
            <img src="${friend.avatar}" alt="${friend.name}" class="friend-avatar">
            <div class="friend-info">
                <div class="friend-name">${friend.name}</div>
                <div class="friend-status">${friend.email}</div>
            </div>
            <div class="friend-actions">
                <button class="btn-small btn-remove" onclick="chatApp.removeFriend(${friend.id})">
                    Remove
                </button>
            </div>
        `;
    return div;
  }

  createFriendRequestElement(request, type) {
    const div = document.createElement("div");
    div.className = "friend-item";

    const actions =
      type === "incoming"
        ? `
                <button class="btn-small btn-accept" onclick="chatApp.acceptFriendRequest(${request.id})">
                    Accept
                </button>
                <button class="btn-small btn-reject" onclick="chatApp.rejectFriendRequest(${request.id})">
                    Reject
                </button>
            `
        : `<span class="friend-status">Pending</span>`;

    div.innerHTML = `
            <img src="${request.avatar}" alt="${
      request.name
    }" class="friend-avatar">
            <div class="friend-info">
                <div class="friend-name">${request.name}</div>
                <div class="friend-status">${
                  type === "incoming" ? "Wants to be friends" : "Request sent"
                }</div>
            </div>
            <div class="friend-actions">
                ${actions}
            </div>
        `;
    return div;
  }

  createGroupElement(group, isJoined = false) {
    const div = document.createElement("div");
    div.className = "group-item";

    const avatar = group.image
      ? `<img src="${group.image}" alt="${group.name}" class="group-avatar">`
      : `<div class="group-avatar">👥</div>`;

    const actions = isJoined
      ? `<button class="btn-small btn-joined">Joined</button>`
      : `<button class="btn-small btn-join" onclick="chatApp.joinGroup(${group.id})">Join</button>`;

    div.innerHTML = `
            ${avatar}
            <div class="group-info">
                <div class="group-name">${group.name}</div>
                <div class="group-description">${group.description || ""}</div>
                <div class="group-meta">${group.member_count} members</div>
            </div>
            <div class="group-actions">
                ${actions}
            </div>
        `;
    return div;
  }

  createChatElement(chat, type) {
    const div = document.createElement("div");
    div.className = "chat-item";
    div.dataset.chatId = chat.id;
    div.dataset.chatType = type;

    const avatar =
      type === "group"
        ? chat.image ||
          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.5 6zm-2.47-12.65L15.45 16l-1.43 5.46 1.43 1.43L17.77 16H20v-2h-4.23l-2.24-8.65zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zm-7-1.5c0-.83-.67-1.5-1.5-1.5S2.5 9.17 2.5 10s.67 1.5 1.5 1.5S5.5 10.83 5.5 10z"/></svg>'
        : chat.avatar;

    const name = type === "group" ? chat.name : chat.name;
    const preview = "Click to start chatting"; // TODO: Load last message

    div.innerHTML = `
            <img src="${avatar}" alt="${name}" class="chat-avatar">
            <div class="chat-info">
                <div class="chat-name">${name}</div>
                <div class="chat-preview">${preview}</div>
            </div>
            <div class="chat-meta">
                <div class="chat-time"></div>
                <div class="unread-count" style="display: none;">0</div>
            </div>
        `;

    div.addEventListener("click", () => {
      this.openChat(chat.id, type, { name, avatar });
    });

    return div;
  }

  setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // Search functionality
    const searchBtn = document.getElementById("search-users-btn");
    const searchInput = document.getElementById("search-input");
    const searchBar = document.querySelector(".search-bar");
    const closeSearchBtn = document.getElementById("close-search");

    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        searchBar.style.display = "flex";
        searchInput.focus();
      });
    }

    if (closeSearchBtn) {
      closeSearchBtn.addEventListener("click", () => {
        searchBar.style.display = "none";
        searchInput.value = "";
      });
    }

    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (query.length >= 2) {
          searchTimeout = setTimeout(() => {
            this.searchUsers(query);
          }, 500);
        }
      });
    }

    // Create group button
    const createGroupBtn = document.getElementById("create-group-btn");
    if (createGroupBtn) {
      createGroupBtn.addEventListener("click", () => {
        this.showModal("create-group-modal");
      });
    }

    // Browse groups button
    const browseGroupsBtn = document.getElementById("browse-groups-btn");
    if (browseGroupsBtn) {
      browseGroupsBtn.addEventListener("click", () => {
        this.loadPublicGroups();
        this.showModal("browse-groups-modal");
      });
    }

    // Create group form
    const createGroupForm = document.getElementById("create-group-form");
    if (createGroupForm) {
      createGroupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.createGroup();
      });
    }

    // Message input and send
    const messageInput = document.getElementById("message-input");
    const sendBtn = document.getElementById("send-btn");

    if (messageInput) {
      messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        } else if (e.key !== "Enter") {
          this.handleTyping();
        }
      });

      messageInput.addEventListener("input", () => {
        this.autoResizeTextarea(messageInput);
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", () => {
        this.sendMessage();
      });
    }

    // Anonymous toggle
    const anonymousToggle = document.getElementById("anonymous-toggle");
    if (anonymousToggle) {
      anonymousToggle.addEventListener("click", () => {
        this.toggleAnonymous();
      });
    }

    // File attachment
    const attachBtn = document.getElementById("attach-btn");
    const fileInput = document.getElementById("file-input");

    if (attachBtn && fileInput) {
      attachBtn.addEventListener("click", () => {
        fileInput.click();
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
          this.handleFileSelect(e.target.files[0]);
        }
      });
    }

    // Logout button
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.logout();
      });
    }

    // Modal controls
    document.querySelectorAll("[data-modal]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.hideModal(btn.dataset.modal);
      });
    });

    // Close modals when clicking outside
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.hideModal(modal.id);
        }
      });
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

    // Update tab content
    document.querySelectorAll(".tab-pane").forEach((pane) => {
      pane.classList.remove("active");
    });
    document.getElementById(`${tabName}-tab`).classList.add("active");
  }

  async searchUsers(query) {
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`
      );
      const users = await response.json();

      this.showSearchResults(users);
    } catch (error) {
      console.error("Search failed:", error);
    }
  }

  showSearchResults(users) {
    const resultsContainer = document.getElementById("search-results");
    if (!resultsContainer) return;

    resultsContainer.innerHTML = "";

    if (users.length === 0) {
      resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No Users Found</h3>
                    <p>Try a different search term</p>
                </div>
            `;
    } else {
      users.forEach((user) => {
        const userElement = document.createElement("div");
        userElement.className = "user-item";
        userElement.innerHTML = `
                    <img src="${user.avatar}" alt="${user.name}" class="user-avatar">
                    <div class="user-info">
                        <div class="user-name">${user.name}</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                    <div class="user-actions">
                        <button class="btn-small btn-send-request" onclick="chatApp.sendFriendRequest(${user.id})">
                            Add Friend
                        </button>
                    </div>
                `;
        resultsContainer.appendChild(userElement);
      });
    }

    this.showModal("search-results-modal");
  }

  async sendFriendRequest(userId) {
    try {
      const response = await fetch(`/api/friends/request/${userId}`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        this.showNotification("Friend request sent!", "success");
        this.hideModal("search-results-modal");
      } else {
        this.showNotification(data.error || "Failed to send request", "error");
      }
    } catch (error) {
      console.error("Failed to send friend request:", error);
      this.showNotification("Failed to send friend request", "error");
    }
  }

  async acceptFriendRequest(userId) {
    try {
      const response = await fetch(`/api/friends/accept/${userId}`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        this.showNotification("Friend request accepted!", "success");
        this.loadFriends();
        this.loadFriendRequests();
        this.loadRecentChats();
      } else {
        this.showNotification(
          data.error || "Failed to accept request",
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to accept friend request:", error);
      this.showNotification("Failed to accept friend request", "error");
    }
  }

  async rejectFriendRequest(userId) {
    try {
      const response = await fetch(`/api/friends/reject/${userId}`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        this.showNotification("Friend request rejected", "info");
        this.loadFriendRequests();
      } else {
        this.showNotification(
          data.error || "Failed to reject request",
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to reject friend request:", error);
      this.showNotification("Failed to reject friend request", "error");
    }
  }

  async removeFriend(userId) {
    if (!confirm("Are you sure you want to remove this friend?")) return;

    try {
      const response = await fetch(`/api/friends/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        this.showNotification("Friend removed", "info");
        this.loadFriends();
        this.loadRecentChats();
      } else {
        this.showNotification(data.error || "Failed to remove friend", "error");
      }
    } catch (error) {
      console.error("Failed to remove friend:", error);
      this.showNotification("Failed to remove friend", "error");
    }
  }

  async createGroup() {
    const name = document.getElementById("group-name").value.trim();
    const description = document
      .getElementById("group-description")
      .value.trim();
    const image = document.getElementById("group-image").value.trim();

    if (!name) {
      this.showNotification("Group name is required", "error");
      return;
    }

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description, image }),
      });

      const data = await response.json();

      if (response.ok) {
        this.showNotification("Group created successfully!", "success");
        this.hideModal("create-group-modal");
        this.loadMyGroups();
        this.loadRecentChats();

        // Clear form
        document.getElementById("create-group-form").reset();
      } else {
        this.showNotification(data.error || "Failed to create group", "error");
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      this.showNotification("Failed to create group", "error");
    }
  }

  async loadPublicGroups() {
    try {
      const response = await fetch("/api/groups/public");
      const groups = await response.json();

      const groupsList = document.getElementById("groups-browse-list");
      if (!groupsList) return;

      groupsList.innerHTML = "";

      if (groups.length === 0) {
        groupsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No Public Groups</h3>
                        <p>Be the first to create a group!</p>
                    </div>
                `;
        return;
      }

      groups.forEach((group) => {
        const groupElement = this.createGroupElement(group, group.is_member);
        groupsList.appendChild(groupElement);
      });
    } catch (error) {
      console.error("Failed to load public groups:", error);
    }
  }

  async joinGroup(groupId) {
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        this.showNotification("Joined group successfully!", "success");
        this.socket.emit("join_group", { group_id: groupId });
        this.loadMyGroups();
        this.loadRecentChats();
        this.loadPublicGroups(); // Refresh the browse list
      } else {
        this.showNotification(data.error || "Failed to join group", "error");
      }
    } catch (error) {
      console.error("Failed to join group:", error);
      this.showNotification("Failed to join group", "error");
    }
  }

  openChat(chatId, chatType, chatInfo) {
    this.currentChat = chatId;
    this.currentChatType = chatType;

    // Hide typing indicator when switching chats
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
      typingIndicator.style.display = "none";
    }

    // Update active chat in sidebar
    document.querySelectorAll(".chat-item").forEach((item) => {
      item.classList.remove("active");
    });
    document
      .querySelector(`[data-chat-id="${chatId}"][data-chat-type="${chatType}"]`)
      ?.classList.add("active");

    // Show chat interface
    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("chat-header").style.display = "flex";
    document.getElementById("messages-area").style.display = "flex";
    document.getElementById("message-input-area").style.display = "block";

    // Update chat header
    document.getElementById("chat-avatar").src = chatInfo.avatar;
    document.getElementById("chat-name").textContent = chatInfo.name;
    document.getElementById("chat-status").textContent =
      chatType === "group" ? "Group chat" : "Direct message";

    // Show/hide anonymous toggle for groups
    const anonymousToggle = document.getElementById("anonymous-toggle");
    if (chatType === "group") {
      anonymousToggle.style.display = "block";
    } else {
      anonymousToggle.style.display = "none";
      this.isAnonymous = false;
    }

    // Load messages
    this.loadMessages();
  }

  async loadMessages() {
    if (!this.currentChat || !this.currentChatType) return;

    try {
      const response = await fetch(
        `/api/messages/${this.currentChat}?type=${this.currentChatType}`
      );
      const messages = await response.json();

      this.displayMessages(messages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }

  displayMessages(messages) {
    const container = document.getElementById("messages-container");
    if (!container) return;

    container.innerHTML = "";

    messages.forEach((message) => {
      const messageElement = this.createMessageElement(message);
      container.appendChild(messageElement);
    });

    // Scroll to bottom after DOM updates
    setTimeout(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  }

  createMessageElement(message) {
    const div = document.createElement("div");
    const isOwn = message.sender_id === this.currentUser.id;

    // Debug logging
    console.log("Creating message element:", {
      messageId: message.id,
      senderId: message.sender_id,
      currentUserId: this.currentUser.id,
      isOwn: isOwn,
      senderName: message.sender_name,
    });

    div.className = `message ${isOwn ? "own" : ""} ${
      message.is_anonymous && !isOwn ? "anonymous" : ""
    }`.trim();
    div.dataset.messageId = message.id;

    const senderName =
      message.is_anonymous && !isOwn ? "Anonymous" : message.sender_name;
    const showSender = this.currentChatType === "group" && !isOwn;

    // For anonymous messages, completely hide the avatar for other users
    const shouldShowAvatar = !isOwn && !message.is_anonymous;

    const messageTime = new Date(message.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    let mediaContent = "";
    if (message.media_url && message.media_type) {
      mediaContent = this.createMediaContent(
        message.media_url,
        message.media_type
      );
    } else if (message.voice_url) {
      mediaContent = this.createVoiceContent(message.voice_url);
    }

    div.innerHTML = `
            ${
              shouldShowAvatar
                ? `<img src="${message.sender_avatar}" alt="${senderName}" class="message-avatar">`
                : ""
            }
            <div class="message-bubble">
                ${
                  showSender
                    ? `
                    <div class="message-header">
                        <span class="message-sender">${senderName}</span>
                        ${
                          message.is_anonymous
                            ? '<span class="anonymous-badge">Anonymous</span>'
                            : ""
                        }
                    </div>
                `
                    : ""
                }
                ${
                  message.content
                    ? `<div class="message-content">${this.escapeHtml(
                        message.content
                      )}</div>`
                    : ""
                }
                ${mediaContent}
                <div class="message-time">${messageTime}</div>
                ${
                  isOwn
                    ? `<div class="message-status">${
                        message.is_read ? "✓✓" : "✓"
                      }</div>`
                    : ""
                }
            </div>
        `;

    return div;
  }

  createMediaContent(mediaUrl, mediaType) {
    switch (mediaType) {
      case "image":
        return `<div class="message-media"><img src="${mediaUrl}" alt="Image" onclick="this.requestFullscreen()"></div>`;
      case "video":
        return `<div class="message-media"><video src="${mediaUrl}" controls></video></div>`;
      case "document":
        const fileName = mediaUrl.split("/").pop();
        return `<div class="message-media"><a href="${mediaUrl}" target="_blank" download><i class="fas fa-file"></i> ${fileName}</a></div>`;
      default:
        return "";
    }
  }

  createVoiceContent(voiceUrl) {
    return `
            <div class="voice-message">
                <button class="voice-play-btn" onclick="chatApp.playVoiceMessage('${voiceUrl}')">
                    <i class="fas fa-play"></i>
                </button>
                <span class="voice-duration">Voice message</span>
            </div>
        `;
  }

  async sendMessage() {
    const messageInput = document.getElementById("message-input");
    const content = messageInput.value.trim();

    if (!content && !this.selectedFile) return;
    if (!this.currentChat || !this.currentChatType) return;

    try {
      const messageData = {
        content,
        [this.currentChatType === "direct" ? "receiver_id" : "group_id"]:
          this.currentChat,
        is_anonymous: this.isAnonymous,
      };

      if (this.selectedFile) {
        const formData = new FormData();
        formData.append("media", this.selectedFile);
        Object.keys(messageData).forEach((key) => {
          formData.append(key, messageData[key]);
        });

        const response = await fetch("/api/messages", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }
      } else {
        // Send via socket for real-time delivery
        this.socket.emit("send_message", messageData);
      }

      // Clear input
      messageInput.value = "";
      this.autoResizeTextarea(messageInput);
      this.clearFileSelection();

      // Stop typing indicator
      this.stopTyping();
    } catch (error) {
      console.error("Failed to send message:", error);
      this.showNotification("Failed to send message", "error");
    }
  }

  handleNewMessage(message) {
    // Add message to current chat if it's the active one
    if (
      this.currentChat &&
      ((this.currentChatType === "direct" &&
        (message.sender_id === this.currentChat ||
          message.receiver_id === this.currentChat)) ||
        (this.currentChatType === "group" &&
          message.group_id === this.currentChat))
    ) {
      const container = document.getElementById("messages-container");
      if (container) {
        const messageElement = this.createMessageElement(message);
        container.appendChild(messageElement);

        // Use setTimeout to ensure DOM is updated before scrolling
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }, 10);
      }
    }

    // Update chat list preview and unread count
    this.updateChatPreview(message);

    // Show notification if not in active chat
    if (
      !document.hasFocus() ||
      (this.currentChat !== message.sender_id &&
        this.currentChat !== message.group_id)
    ) {
      this.showNotification(`New message from ${message.sender_name}`, "info");
    }
  }

  handleTyping() {
    if (!this.currentChat || !this.currentChatType) return;

    // Emit typing start
    this.socket.emit("typing_start", {
      [this.currentChatType === "direct" ? "receiver_id" : "group_id"]:
        this.currentChat,
    });

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Set timeout to stop typing indicator
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 2000);
  }

  stopTyping() {
    if (!this.currentChat || !this.currentChatType) return;

    this.socket.emit("typing_stop", {
      [this.currentChatType === "direct" ? "receiver_id" : "group_id"]:
        this.currentChat,
    });

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  showTypingIndicator(data) {
    const indicator = document.getElementById("typing-indicator");
    if (!indicator) return;

    // Only show typing indicator if it's in the current active chat
    const isCurrentChat =
      (this.currentChatType === "direct" &&
        (data.userId === this.currentChat ||
          data.receiver_id === this.currentChat)) ||
      (this.currentChatType === "group" && data.groupId === this.currentChat);

    if (!isCurrentChat) {
      return; // Don't show typing indicator for other chats
    }

    // Don't show typing indicator for own typing
    if (data.userId === this.currentUser.id) {
      return;
    }

    const typingText = indicator.querySelector(".typing-text");
    if (typingText) {
      typingText.textContent = `${data.name} is typing...`;
    }

    indicator.style.display = "block";
  }

  hideTypingIndicator(data) {
    const indicator = document.getElementById("typing-indicator");
    if (!indicator) return;

    // Only hide typing indicator if it's from the current active chat
    const isCurrentChat =
      (this.currentChatType === "direct" &&
        (data.userId === this.currentChat ||
          data.receiver_id === this.currentChat)) ||
      (this.currentChatType === "group" && data.groupId === this.currentChat);

    if (!isCurrentChat) {
      return; // Don't hide typing indicator for other chats
    }

    // Don't process hide for own typing (shouldn't be visible anyway)
    if (data.userId === this.currentUser.id) {
      return;
    }

    indicator.style.display = "none";
  }

  toggleAnonymous() {
    this.isAnonymous = !this.isAnonymous;
    const toggle = document.getElementById("anonymous-toggle");
    const notification = document.getElementById("anonymous-notification");

    if (this.isAnonymous) {
      toggle.classList.add("active");
      toggle.title = "Anonymous Mode: ON";

      // Show notification for group chats only
      if (this.currentChatType === "group" && notification) {
        notification.style.display = "block";
        // Auto-hide after 3 seconds
        setTimeout(() => {
          if (notification.style.display === "block") {
            notification.style.display = "none";
          }
        }, 3000);
      }
    } else {
      toggle.classList.remove("active");
      toggle.title = "Anonymous Mode: OFF";

      // Hide notification
      if (notification) {
        notification.style.display = "none";
      }
    }
  }

  handleFileSelect(file) {
    this.selectedFile = file;

    const preview = document.getElementById("file-preview");
    const fileName = preview.querySelector(".file-name");

    if (fileName) {
      fileName.textContent = file.name;
    }

    preview.style.display = "flex";

    // Add remove button listener
    const removeBtn = preview.querySelector(".btn-remove");
    if (removeBtn) {
      removeBtn.onclick = () => this.clearFileSelection();
    }
  }

  clearFileSelection() {
    this.selectedFile = null;
    document.getElementById("file-input").value = "";
    document.getElementById("file-preview").style.display = "none";
  }

  autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }

  playVoiceMessage(voiceUrl) {
    // Create audio element and play
    const audio = new Audio(voiceUrl);
    audio.play().catch((error) => {
      console.error("Failed to play voice message:", error);
    });
  }

  updateUserStatus(userId, isOnline) {
    // Update status indicators in UI
    const statusElements = document.querySelectorAll(
      `[data-user-id="${userId}"] .status`
    );
    statusElements.forEach((el) => {
      el.classList.remove("online", "offline");
      el.classList.add(isOnline ? "online" : "offline");
      el.textContent = isOnline ? "Online" : "Offline";
    });
  }

  updateMessageStatus(messageId, status) {
    const messageEl = document.querySelector(
      `[data-message-id="${messageId}"]`
    );
    if (messageEl) {
      const statusEl = messageEl.querySelector(".message-status");
      if (statusEl) {
        statusEl.textContent = status === "read" ? "✓✓" : "✓";
      }
    }
  }

  updateChatPreview(message) {
    // Update chat list with latest message
    // This would update the last message preview and timestamp
    // Implementation depends on your specific UI requirements
  }

  updateFriendsBadge(count) {
    const badge = document.getElementById("friends-badge");
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = "block";
      } else {
        badge.style.display = "none";
      }
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("active");
    }
  }

  showNotification(message, type = "info") {
    // Create a simple notification
    // You could replace this with a more sophisticated notification system
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Chat App", { body: message });
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async logout() {
    try {
      await fetch("/auth/logout");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/";
    }
  }
}

// Initialize the chat app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.chatApp = new ChatApp();

  // Request notification permission
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
});

// Make chat app available globally
window.chatApp = null;
