const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Groq = require("groq-sdk");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "15mb" }));

// Groq Configuration
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY });

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "gym_ai_default_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.REDIRECT_URI || "/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Serve static files
app.use(express.static(path.join(__dirname, "../client")));

app.post("/chat", async (req, res) => {
  try {
    const { message, image } = req.body;
    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ reply: "Error: API key is missing." });
    }

    let messages = [];
    if (image) {
      // Use llama-3.2-90b-vision-preview as the replacement model
      messages = [
        {
          role: "user",
          content: [
            { type: "text", text: message || "Analyze this image for me." },
            {
              type: "image_url",
              image_url: {
                url: image
              }
            }
          ]
        }
      ];
    } else {
      messages = [{ role: "user", content: message }];
    }

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: image ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content || "I couldn@'@t analyze that image. Please try again.";
    res.json({ reply: text });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ reply: "Error: " + error.message });
  }
});

app.get("/api/user", (req, res) => {
  res.json(req.user || null);
});

// Authentication Routes
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect to home.
    res.redirect("/");
  }
);

app.get("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});