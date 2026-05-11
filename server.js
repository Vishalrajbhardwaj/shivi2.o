const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

let lastRequestTime = 0;

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
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are SHIVI, a smart emotional AI assistant. Reply short and human-like." },
          { role: "user", content: prompt },
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
    console.error("Server Error:", err.message);
    res.json({ reply: "Sorry, SHIVI AI temporarily unavailable hai." });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("✅ SHIVI AI Server Running");
});
