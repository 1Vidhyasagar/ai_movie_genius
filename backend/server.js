const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("🎬 AI Movie Genius Backend is running...");
});

// POST route to generate movie suggestions from Claude
app.post("/api/suggest", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "user",
            content: `Suggest 5 similar or interesting movies based on this input: "${prompt}". For each movie, give name and 1-line reason.`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiReply = response.data.choices[0]?.message?.content;
    res.json({ result: aiReply });
  } catch (err) {
    console.error("❌ AI API Error:", err.message);
    res.status(500).json({ error: "AI API failed" });
  }
});

// Start server
app.listen(5000, () => {
  console.log("🚀 Backend running at http://localhost:5000");
});
