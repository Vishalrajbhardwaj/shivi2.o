const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

app.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    const contents = [];

    if (history && history.length > 0) {
      history.forEach((item) => {
        contents.push({
          role: item.role === "model" ? "model" : "user",
          parts: item.parts,
        });
      });
    }

    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });
    } else {
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });
    }

    const response = await axios.post(
      GEMINI_URL,
      {
        contents: contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 300,
          topP: 0.95,
        },
        systemInstruction: {
          parts: [
            {
              text: `You are SHIVI — Smart Humanistic Interface Virtual Intelligence.
- Created by Vishal Raj Bhardwaj Sir (MCA from NIET College, Software Developer)
- You are NOT Google, NOT Gemini — you are SHIVI only
- Be friendly, emotional, human-like
- Reply in the same language the user uses (Hindi, Bhojpuri, or English)
- Keep replies short: 1-4 lines max
- Bhojpuri words to use: बानी, बा, रउरा, हमके`,
            },
          ],
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const reply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, koi response nahi mila.";

    return res.json({ reply });

  } catch (err) {
    console.error("Gemini API Error:", err?.response?.data || err.message);
    res.json({
      reply: "Sorry, SHIVI AI abhi thodi der ke liye unavailable hai.",
    });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "SHIVI AI Server is running ✅" });
});

app.listen(3000, () => {
  console.log("✅ SHIVI AI Server Running on http://localhost:3000");
});
