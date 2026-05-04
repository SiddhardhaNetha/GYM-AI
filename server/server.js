const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'gym_ai_default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using https
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    // In a real app, you would save the profile to a database here
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Simple test endpoint first
app.get("/api/hello", (req, res) => {
  res.json({ message: "Server is working!" });
});

// Serve static files from client folder
console.log("📁 Static files path:", path.join(__dirname, "../client"));
app.use(express.static(path.join(__dirname, "../client")));

app.get("/test", (req, res) => {
  res.json({ status: "Server is working!", apiKey: process.env.GEMINI_API_KEY ? "✅ API Key loaded" : "❌ No API Key" });
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  console.log("📨 Received message:", userMessage);
  // ... existing chat code ...
});

// Auth Routes
app.get("/auth/google", 
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback", 
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get("/api/user", (req, res) => {
  console.log("🔍 Auth check request. User authenticated:", !!req.user);
  res.json(req.user || null);
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

app.listen(5000, () => {
  console.log("🏋️ Gym AI Server running on http://localhost:5000");
});