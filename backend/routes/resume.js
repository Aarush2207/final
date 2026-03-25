require("dotenv").config();

const express = require('express');
const router = express.Router();
const Groq = require("groq-sdk");
const supabase = require('../supabaseClient');
const multer = require("multer");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function extractJSON(rawText) {
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  return JSON.parse(rawText.substring(start, end + 1));
}

// ── GENERATE QUESTIONS ─────────────────
router.post('/generate', async (req, res) => {
  const { resume_text } = req.body;

  const prompt = `
Generate 8 interview questions from this resume.

Resume:
${resume_text?.substring(0, 3000)}

Return ONLY JSON:
{
 "questions":[
  {"index":0,"question":"","type":"","skill_focus":"","difficulty":""}
 ]
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "qwen/qwen3-32b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const parsed = extractJSON(response.choices[0].message.content);

    res.json(parsed);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SPEECH TO TEXT ─────────────────
router.post('/speech-to-text', upload.single("audio"), async (req, res) => {
  try {
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-large-v3",
    });

    res.json({ text: transcription.text });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── EVALUATE ─────────────────
router.post('/evaluate', async (req, res) => {
  const { answers, questions } = req.body;

  const qa = questions.map((q, i) =>
    `Q: ${q.question}\nA: ${answers[i] || "No answer"}`
  ).join("\n\n");

  const prompt = `
Evaluate this interview.

${qa}

Return ONLY JSON:
{
 "overall_score":0,
 "strengths":[],
 "weaknesses":[],
 "recommendation":"",
 "summary":""
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "qwen/qwen3-32b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const parsed = extractJSON(response.choices[0].message.content);

    res.json(parsed);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;