# 💬 Real-time Chat Application

A full-featured, modern real-time chat application built with Node.js, Express, Socket.IO, MySQL, and Google OAuth2 authentication. Features a sleek, eye-friendly design with comprehensive messaging capabilities.

## ✨ Features

### 🔐 Authentication & Security

### 🔐 Authentication & Security

- **Google OAuth2** login integration with secure session management
- **User profiles** with avatar and display name
- **CSRF protection** and XSS prevention
- **Rate limiting** for API endpoints (1000 requests/15min)
- **SQL injection prevention** with prepared statements

### 👥 Advanced Friendship System

- **Smart user search** by name or email
- **Friend request management** (send, accept, reject)
- **1-to-1 private messaging** (friends only)
- **Friend removal** with confirmation
- **Real-time friend status** updates

### 🗣️ Groups & Communities

- **Create public groups** with custom descriptions
- **Browse and discover** existing groups
- **Multi-member group chats** with real-time updates
- **Anonymous messaging mode** (toggle on/off per group)
- **Group management** and member controls
- **Join/leave groups** instantly

### 💬 Advanced Real-time Messaging

- **Instant message delivery** with Socket.IO
- **Smart typing indicators** (scoped to active chat)
- **Read receipts** (✓ sent, ✓✓ delivered, ✓✓✓ read)
- **Online/offline status** with live presence tracking
- **Message persistence** and history
- **Anonymous mode notifications** for group chats

### 📎 Rich Media Support & Voice (Demo)

- **Image sharing** with inline preview and optimization
- **Video file sharing** with embedded player
- **Document attachment** support (PDF, DOC, etc.)
- **Voice message UI** (placeholder/demo interface only)
- **Voice controls mockup** (UI demonstration, not functional)
- **Drag & drop uploads** with progress indicators
- **File validation** (size, type, security checks)

### 🎨 Modern UI/UX Design

- **Eye-friendly color scheme** (#A62212 primary tone)
- **Modern gradient backgrounds** on login page
- **Fully responsive design** for all devices
- **Intuitive interface** with smooth interactions
- **Real-time notifications** and status updates
- **Modal dialogs** with confirmation workflows
- **Smooth animations** and micro-interactions
- **Professional typography** with Inter font family
- **Accessible design** with proper contrast ratios

## 🛠 Tech Stack

### Backend Technologies

- **Node.js** (v14+) - Runtime environment with async capabilities
- **Express.js** - Fast, minimalist web framework
- **Socket.IO** - Real-time bidirectional communication
- **MySQL** (v8+) - Reliable relational database
- **Passport.js** - Flexible authentication middleware
- **Multer** - Multipart/form-data handling for file uploads
- **Express Rate Limit** - API rate limiting (1000 req/15min)
- **Helmet** - Security middleware for HTTP headers
- **CORS** - Cross-origin resource sharing
- **Bcrypt** - Password hashing and salting

### Frontend Technologies

- **HTML5** - Semantic markup with modern features
- **CSS3** - Advanced styling with custom properties
  - **Modern color scheme** (#A62212 primary)
  - **CSS Grid & Flexbox** layouts
  - **CSS Custom Properties** for theming
  - **Responsive design** with mobile-first approach
- **Vanilla JavaScript** - Pure JS with ES6+ features
- **Socket.IO Client** - Real-time client-side events

### Authentication & Security

- **Google OAuth2** - Secure third-party authentication
- **Express Sessions** - Server-side session management
- **CSRF Protection** - Cross-site request forgery prevention
- **Input Sanitization** - XSS attack prevention
- **SQL Prepared Statements** - Injection attack prevention

## 📋 Prerequisites

Before running this application, ensure you have the following installed:

1. **Node.js** (v14.0.0 or higher)

   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **MySQL** (v8.0 or higher)

   - Download from [mysql.com](https://dev.mysql.com/downloads/)
   - Verify installation: `mysql --version`
   - Ensure MySQL service is running

3. **Google Cloud Console Account**

   - Required for OAuth2 authentication setup
   - Free account available at [console.cloud.google.com](https://console.cloud.google.com/)

4. **Git** (recommended for version control)
   - Download from [git-scm.com](https://git-scm.com/)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sqlnp-chatapp
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:

- Express.js, Socket.IO, MySQL2, Passport.js
- Security packages (helmet, express-rate-limit)
- Development tools (nodemon)

### 3. Database Setup

#### Create Database

```sql
CREATE DATABASE chat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Database Tables

The application automatically creates the following tables on first run:

- `users` - User profiles and authentication data
- `friends` - Friend relationships and requests
- `groups` - Group information and settings
- `group_members` - Group membership records
- `messages` - All chat messages and media
- `online_users` - Real-time user presence tracking

### 4. Google OAuth2 Setup

1. **Create Google Cloud Project:**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the **Google+ API** in the API Library

2. **Create OAuth2 Credentials:**

   - Navigate to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Name: `Chat App OAuth Client`
   - **Authorized JavaScript origins:** `http://localhost:3000`
   - **Authorized redirect URIs:** `http://localhost:3000/auth/google/callback`

3. **Production Setup:**
   - For production, update origins to your domain (e.g., `https://yourdomain.com`)
   - Update redirect URI accordingly

### 5. Environment Configuration

1. **Create Environment File:**

```bash
cp .env.example .env
```

2. **Update Configuration:**

3. **Update Configuration:**

```env
# 🌐 Server Configuration
PORT=3000
NODE_ENV=development

# 🗄️ Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chat_db
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password

# 🔑 Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# 🔒 Session Configuration (Generate a strong secret)
SESSION_SECRET=your_secure_random_session_secret_here_min_32_chars

# 🌍 Application URLs
BASE_URL=http://localhost:3000

# 📁 File Upload Configuration (Optional)
MAX_FILE_SIZE=10485760
# 10MB in bytes - adjust as needed

# 🔧 Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000
# 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=1000
# Maximum requests per window
```

### 6. Start the Application

**Development Mode (Recommended):**

```bash
npm run dev
```

**Production Mode:**

```bash
npm start
```

The application will be available at: **http://localhost:3000**

#### First Run Checklist:

- ✅ Database connection successful
- ✅ Tables created automatically
- ✅ Google OAuth redirect working
- ✅ File upload directory created
- ✅ Socket.IO connection established

## Database Schema

The application uses the following MySQL tables:

### users

- `id` - Primary key
- `name` - User's display name
- `email` - User's email address
- `avatar` - Profile picture URL
- `google_id` - Google OAuth ID
- `created_at`, `updated_at` - Timestamps

### friends

- `id` - Primary key
- `user_id` - User who sent the request
- `friend_id` - User who received the request
- `status` - 'pending', 'accepted', 'rejected'
- `created_at`, `updated_at` - Timestamps

### groups

- `id` - Primary key
- `name` - Group name
- `description` - Group description
- `image` - Group image URL
- `created_by` - Creator user ID
- `created_at`, `updated_at` - Timestamps

### group_members

- `id` - Primary key
- `group_id` - Group ID
- `user_id` - Member user ID
- `joined_at` - Join timestamp

### messages

- `id` - Primary key
- `sender_id` - Sender user ID
- `receiver_id` - Receiver user ID (for direct messages)
- `group_id` - Group ID (for group messages)
- `content` - Message text content
- `media_url` - Media file URL
- `voice_url` - Voice message URL
- `media_type` - 'image', 'video', 'document', 'voice'
- `is_anonymous` - Anonymous flag for group messages
- `is_read` - Read status
- `timestamp` - Message timestamp

## API Endpoints

### Authentication

- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/logout` - Logout user
- `GET /auth/status` - Check authentication status

### Users

- `GET /api/users/search?q=query` - Search users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile

### Friends

- `POST /api/friends/request/:id` - Send friend request
- `POST /api/friends/accept/:id` - Accept friend request
- `POST /api/friends/reject/:id` - Reject friend request
- `GET /api/friends/list` - Get friends list
- `GET /api/friends/requests` - Get pending requests
- `DELETE /api/friends/:id` - Remove friend

### Groups

- `POST /api/groups` - Create new group
- `GET /api/groups/public` - Get all public groups
- `GET /api/groups/my` - Get user's groups
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/leave` - Leave group
- `GET /api/groups/:id` - Get group details

### Messages

- `POST /api/messages` - Send message (with file upload)
- `GET /api/messages/:chatId?type=direct|group` - Get chat messages
- `GET /api/messages/unread/count` - Get unread message counts
- `POST /api/messages/mark-read` - Mark messages as read

## ⚡ Socket.IO Real-time Events

### 📤 Client to Server Events

| Event                | Description                                      | Parameters                               |
| -------------------- | ------------------------------------------------ | ---------------------------------------- |
| `authenticate`       | Authenticate socket connection with user session | `{ userId, sessionId }`                  |
| `send_message`       | Send real-time message to chat                   | `{ content, chatId, type, isAnonymous }` |
| `typing_start`       | Indicate user started typing                     | `{ chatId, chatType, userName }`         |
| `typing_stop`        | Indicate user stopped typing                     | `{ chatId, chatType }`                   |
| `join_group`         | Join a group chat room                           | `{ groupId, userId }`                    |
| `leave_group`        | Leave a group chat room                          | `{ groupId, userId }`                    |
| `get_online_users`   | Request list of online users                     | `{}`                                     |
| `mark_messages_read` | Mark messages as read                            | `{ chatId, messageIds[] }`               |

### 📥 Server to Client Events

| Event           | Description                       | Data Structure                           |
| --------------- | --------------------------------- | ---------------------------------------- |
| `authenticated` | Confirm successful authentication | `{ status: 'success', userId }`          |
| `auth_error`    | Authentication failed             | `{ error: 'message' }`                   |
| `new_message`   | New message received in chat      | `{ message, chatId, sender, timestamp }` |
| `message_sent`  | Confirmation message was sent     | `{ messageId, status, timestamp }`       |
| `typing_start`  | User started typing indicator     | `{ userId, userName, chatId, chatType }` |
| `typing_stop`   | User stopped typing indicator     | `{ userId, chatId, chatType }`           |
| `user_online`   | User came online notification     | `{ userId, userName, avatar }`           |
| `user_offline`  | User went offline notification    | `{ userId, lastSeen }`                   |
| `message_read`  | Message read receipt              | `{ messageId, readBy, timestamp }`       |
| `online_users`  | List of currently online users    | `{ users: [{ id, name, avatar }] }`      |
| `group_joined`  | User joined group notification    | `{ groupId, userId, userName }`          |
| `group_left`    | User left group notification      | `{ groupId, userId, userName }`          |

### 🔄 Real-time Features

- **Instant Messaging:** Sub-100ms message delivery
- **Typing Indicators:** Scoped to specific chats (direct/group)
- **Presence Tracking:** Real-time online/offline status
- **Read Receipts:** Message delivery and read confirmation
- **Group Events:** Join/leave notifications with member updates
- **Connection Recovery:** Automatic reconnection with state restoration

## File Structure

```
sqlnp-chatapp/
├── config/
│   ├── database.js      # Database configuration and initialization
│   └── passport.js      # Passport OAuth configuration
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── users.js        # User management routes
│   ├── friends.js      # Friend system routes
│   ├── groups.js       # Group management routes
│   ├── messages.js     # Messaging routes
│   └── socket.js       # Socket.IO event handlers
├── public/
│   ├── css/
│   │   ├── login.css   # Login page styles
│   │   └── chat.css    # Chat application styles
│   ├── js/
│   │   ├── chat.js     # Main chat functionality
│   │   ├── ui.js       # UI helper functions
│   │   └── media.js    # Media handling functions
│   ├── login.html      # Login page
│   └── chat.html       # Chat application
├── uploads/            # File upload directory
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── .env              # Environment variables
└── README.md         # This file
```

## 🎯 Features in Detail

### 🕵️ Anonymous Messaging System

- **Group-Only Feature:** Available exclusively in group chats
- **Real-time Toggle:** Switch anonymous mode on/off instantly
- **Visual Indicators:** Clear "Anonymous" badges for anonymous messages
- **Smart Notifications:** "Now you're appearing as anonymous!" alerts
- **Privacy Protection:** Username completely hidden in anonymous mode
- **Seamless Integration:** No page refresh required for mode switching

### 🎤 Voice Messages (Placeholder/Demo)

> **Note:** Voice messaging is currently implemented as a UI demonstration only. The interface shows recording controls and animations, but actual audio recording and playback functionality is not operational.

- **Demo Interface:** Click-to-record button with visual feedback
- **Mock Timer:** Simulated recording duration display
- **UI Preview:** Recording animation and progress indicators
- **Placeholder Controls:** Non-functional play/pause buttons for demonstration
- **Browser Compatibility:** UI components work across all modern browsers
- **Future Implementation:** Ready for backend audio processing integration

### 📁 Comprehensive File Sharing

- **Drag & Drop Support:** Intuitive file upload experience
- **Multi-format Support:** Images, videos, documents, archives
- **Smart Previews:** Inline image previews and video thumbnails
- **Size Validation:** 10MB limit with clear error messaging
- **Security Scanning:** File type validation and safety checks
- **Progress Tracking:** Real-time upload progress indicators
- **Gallery View:** Organized media display in chat history

### ⚡ Real-time Interaction Features

- **Sub-100ms Delivery:** Lightning-fast message transmission
- **Smart Typing Indicators:** Context-aware typing notifications
  - Scoped to active chat (prevents cross-chat notifications)
  - Shows actual user names typing
  - Auto-cleanup when switching chats
- **Advanced Read Receipts:**
  - ✓ Message sent to server
  - ✓✓ Message delivered to recipient
  - ✓✓✓ Message read by recipient (direct chats only)
- **Live Presence System:**
  - Real-time online/offline status
  - Last seen timestamps
  - Automatic status updates
  - Presence in group member lists

### 🎨 Modern Design System

- **Eye-friendly Colors:** Professional #A62212 primary palette
- **Gradient Backgrounds:** Modern purple-to-pink login screen
- **Consistent Theming:** CSS custom properties throughout
- **Responsive Layout:** Mobile-first responsive design
- **Micro-interactions:** Smooth hover effects and transitions
- **Accessibility:** Proper contrast ratios and keyboard navigation
- **Typography:** Clean Inter font family for readability
- **Visual Hierarchy:** Clear information architecture

### 🔒 Security & Performance

- **Rate Limiting:** 1000 requests per 15-minute window
- **Input Sanitization:** XSS and injection attack prevention
- **Secure File Uploads:** Type validation and size restrictions
- **HTTPS Ready:** Production-ready SSL/TLS configuration
- **Session Security:** Secure cookie configuration
- **Database Security:** Prepared statements and connection pooling

## Security Features

- Google OAuth2 authentication
- Session-based user management
- CSRF protection
- File upload validation
- SQL injection prevention with prepared statements
- XSS protection with input sanitization
- Rate limiting for API endpoints

## 🌐 Browser Support

### ✅ Fully Supported

- **Chrome/Chromium** 70+ (Recommended)
- **Firefox** 65+ (Full WebRTC support)
- **Safari** 13+ (macOS and iOS)
- **Edge** 79+ (Chromium-based)
- **Mobile Safari** 13+ (iOS)
- **Chrome Mobile** 70+ (Android)

### ⚠️ Limited Support

- **Internet Explorer** - Not supported (lacks modern ES6 features)
- **Opera Mini** - Limited real-time features

### 🔧 Required Browser Features

- **WebSocket Support** - For real-time messaging
- **File API** - For drag & drop file uploads
- **MediaRecorder API** - For future voice message implementation
- **localStorage** - For client-side data persistence
- **CSS Grid & Flexbox** - For responsive layout

## 🛠 Development

### Development Environment Setup

**Quick Start:**

```bash
# Clone and setup
git clone <repository-url>
cd sqlnp-chatapp
npm install
cp .env.example .env

# Configure .env file with your credentials
# Start development server
npm run dev
```

**Development Features:**

- **Hot Reloading** - Automatic server restart with nodemon
- **Debug Logging** - Enhanced console output in development mode
- **Error Stack Traces** - Detailed error information
- **Development Database** - Separate dev database recommended

### Code Structure

```
📁 Project Architecture
├── 🌐 server.js           # Main application entry point
├── ⚙️ config/            # Configuration files
│   ├── database.js        # MySQL connection & initialization
│   └── passport.js        # OAuth & authentication setup
├── 🛣️ routes/            # API endpoints
│   ├── auth.js           # Authentication routes
│   ├── users.js          # User management
│   ├── friends.js        # Friend system API
│   ├── groups.js         # Group management
│   ├── messages.js       # Messaging API
│   └── socket.js         # Real-time event handlers
├── 🎨 public/            # Frontend assets
│   ├── css/              # Stylesheets
│   ├── js/               # Client-side JavaScript
│   ├── login.html        # Authentication page
│   └── chat.html         # Main application
└── 📁 uploads/           # File upload storage
```

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 🔴 Database Connection Failed

**Symptoms:** "Error connecting to database" or "ECONNREFUSED"

```bash
# Check MySQL service status
sudo systemctl status mysql    # Linux
brew services list mysql       # macOS
sc query mysql                # Windows

# Test connection manually
mysql -u username -p database_name
```

**Solutions:**

- ✅ Ensure MySQL service is running
- ✅ Verify credentials in `.env` file
- ✅ Check if database exists: `SHOW DATABASES;`
- ✅ Verify user permissions: `SHOW GRANTS FOR 'username'@'localhost';`

#### 🔴 Google OAuth Not Working

**Symptoms:** "OAuth callback error" or "Invalid client"
**Solutions:**

- ✅ Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- ✅ Check authorized origins in Google Console: `http://localhost:3000`
- ✅ Ensure redirect URI matches exactly: `http://localhost:3000/auth/google/callback`
- ✅ Enable Google+ API in Google Cloud Console
- ✅ For HTTPS in production, update all URLs accordingly

#### 🔴 File Uploads Not Working

**Symptoms:** "Upload failed" or "File too large"

```bash
# Check upload directory permissions
ls -la uploads/                # Should be writable
chmod 755 uploads/             # Fix permissions if needed
```

**Solutions:**

- ✅ Verify `uploads/` directory exists and is writable
- ✅ Check file size limits in code and server configuration
- ✅ Ensure sufficient disk space available
- ✅ Validate file types are allowed in the application

#### 🔴 Socket.IO Connection Issues

**Symptoms:** "Real-time features not working" or "Connection timeout"
**Solutions:**

- ✅ Check browser console for WebSocket errors
- ✅ Verify server is running and accessible
- ✅ Check firewall/antivirus blocking WebSocket connections
- ✅ Ensure ports are not blocked by network administrator
- ✅ Test with different browsers to isolate issues

#### 🔴 Rate Limiting Issues

**Symptoms:** "Too many requests" or 429 errors
**Solutions:**

- ✅ Check current rate limit settings in `.env`
- ✅ Adjust `RATE_LIMIT_MAX_REQUESTS` for development
- ✅ Clear browser cache and cookies
- ✅ Wait for rate limit window to reset (default: 15 minutes)

### 🔍 Debug Mode

Enable detailed logging by setting:

```env
NODE_ENV=development
DEBUG=*
```

This provides:

- **SQL Query Logging** - See all database operations
- **Socket Event Logging** - Track real-time events
- **Request/Response Logging** - Monitor API calls
- **Error Stack Traces** - Detailed error information

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 🚀 Quick Contributing Guide

1. **Fork the Repository**

   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/yourusername/sqlnp-chatapp.git
   cd sqlnp-chatapp
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b feature/amazing-new-feature
   # or
   git checkout -b bugfix/fix-important-issue
   ```

3. **Make Your Changes**

   - Follow existing code style and conventions
   - Add comments for complex logic
   - Update README if needed
   - Test your changes thoroughly

4. **Commit & Push**

   ```bash
   git add .
   git commit -m "✨ Add amazing new feature"
   git push origin feature/amazing-new-feature
   ```

5. **Submit Pull Request**
   - Provide clear description of changes
   - Include screenshots for UI changes
   - Reference any related issues

### 🎯 Contribution Areas

- **🐛 Bug Fixes** - Help squash bugs and improve stability
- **✨ New Features** - Add exciting new functionality
- **🎨 UI/UX Improvements** - Enhance user experience
- **📚 Documentation** - Improve guides and code comments
- **🧪 Testing** - Add unit tests and integration tests
- **🔒 Security** - Identify and fix security vulnerabilities

### 📋 Development Guidelines

- **Code Style:** Use ESLint and Prettier for consistent formatting
- **Commits:** Use conventional commit messages (feat:, fix:, docs:, etc.)
- **Testing:** Add tests for new features and bug fixes
- **Documentation:** Update README and inline comments
- **Performance:** Consider performance impact of changes

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### MIT License Summary:

✅ **Permissions:** Commercial use, modification, distribution, private use  
❌ **Limitations:** No liability, no warranty  
📋 **Conditions:** License and copyright notice must be included

## 🆘 Support & Community

### 📧 Get Help

- **GitHub Issues:** [Create an issue](https://github.com/yourusername/sqlnp-chatapp/issues) for bugs and feature requests
- **Email Support:** contact@example.com
- **Discord Community:** [Join our Discord](https://discord.gg/yourserver) (if available)

### 📊 Project Stats

- **Language:** JavaScript (Node.js)
- **Database:** MySQL
- **Real-time:** Socket.IO
- **Authentication:** Google OAuth2
- **License:** MIT
- **Version:** 1.0.0

### 🌟 Show Your Support

If you found this project helpful, please consider:

- ⭐ **Star the repository** on GitHub
- 🐛 **Report bugs** to help improve the project
- 💡 **Suggest features** for future development
- 🤝 **Contribute code** to make it even better
- 📢 **Share with others** who might find it useful

---

<div align="center">

**Built with ❤️ using Node.js, Socket.IO, and MySQL**

[⬆️ Back to top](#-real-time-chat-application)

</div>
