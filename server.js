const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =====================
// RATE LIMIT
// =====================
let lastRequestTime = 0;

// =====================
// CHAT API
// =====================
app.post("/chat", async (req, res) => {
  try {
    const now = Date.now();

    lastRequestTime = now;

    const { message, history } = req.body;

    const prompt = `
You are SHIVI.
Full form: Smart Humanistic Interface Virtual Intelligence.

Personality:
- Friendly, Emotional, Smart, Human-like
- Hindi + English mix
- Short clean replies (1-4 lines)
- If asked who made you: Mujhe Vishal Raj Bhardwaj Sir ne banaya hai

Conversation History:
${JSON.stringify(history || [])}

User Message:
${message}
`;

    // =====================
    // OPENROUTER (MAIN AI)
    // =====================
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are SHIVI, a smart emotional AI assistant. Reply short and human-like.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices[0].message.content;

    return res.json({ reply });
  } catch (err) {
    console.error("Server Error:", err);

    res.json({
      reply: "Sorry, SHIVI AI temporarily unavailable hai.",
    });
  }
});

// =====================
app.listen(3000, () => {
  console.log("✅ SHIVI AI Server Running on http://localhost:3000");
});