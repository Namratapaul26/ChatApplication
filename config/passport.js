const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { pool } = require("./database");
require("dotenv").config();

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length > 0) {
      done(null, rows[0]);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        const [existingUsers] = await pool.execute(
          "SELECT * FROM users WHERE google_id = ?",
          [profile.id]
        );

        if (existingUsers.length > 0) {
          // User exists, return the user
          return done(null, existingUsers[0]);
        } else {
          // Create new user
          const [result] = await pool.execute(
            "INSERT INTO users (name, email, avatar, google_id) VALUES (?, ?, ?, ?)",
            [
              profile.displayName,
              profile.emails[0].value,
              profile.photos[0].value,
              profile.id,
            ]
          );

          // Get the newly created user
          const [newUser] = await pool.execute(
            "SELECT * FROM users WHERE id = ?",
            [result.insertId]
          );

          return done(null, newUser[0]);
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
