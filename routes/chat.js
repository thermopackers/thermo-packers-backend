import express from "express";
import allProducts from "../data/products.js";  
import Chat from "../models/chat.js";
import { OpenAI } from "openai";
import dotenv from "dotenv";

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Retry wrapper for OpenAI API calls
async function callOpenAIWithRetry(messages, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const completion = await openai.chat.completions.create({
        messages,
        model: "gpt-3.5-turbo",
      });
      return completion;
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        console.warn(`Rate limit hit. Retrying in ${delay}ms... [Attempt ${i + 1}]`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }
}

router.post("/", async (req, res) => {
  const { message, context = [] } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ reply: "Invalid message input." });
  }

  const lower = message.toLowerCase();

  // Exact product match
  const exactMatch = allProducts.find(p => lower.includes(p.name.toLowerCase()));
  if (exactMatch) {
    const slug = exactMatch.name.toLowerCase().replace(/\s+/g, "-");
    const reply = `Sure! Here's more about "${exactMatch.name}".`;
    await Chat.create({ userMessage: message, botReply: reply });
    return res.json({ reply, redirect: `/product/${slug}`, context });
  }

  // Keyword-based category match
  const matchedCategory = allProducts.find(p =>
    p.keywords?.some(k => lower.includes(k.toLowerCase()))
  );
  if (matchedCategory) {
    const slug = matchedCategory.category.toLowerCase().replace(/\s+/g, "-");
    const reply = `Let me take you to "${matchedCategory.category}" products.`;
    await Chat.create({ userMessage: message, botReply: reply });
    return res.json({ reply, redirect: `/products/${slug}`, context });
  }

  // Fallback to GPT-based response
  const chatHistory = context.map(msg => ({ role: msg.role, content: msg.text }));
  chatHistory.push({ role: "user", content: message });

  try {
    const messages = [
      {
        role: "system",
        content: "You are SmartBot, an intelligent assistant for an EPS Thermocol company. Always try to suggest products or guide users politely."
      },
      ...chatHistory
    ];

    const completion = await callOpenAIWithRetry(messages);
    const reply = completion.choices[0].message.content;

    await Chat.create({ userMessage: message, botReply: reply });

    return res.json({
      reply,
      context: [...context, { role: "user", text: message }, { role: "bot", text: reply }]
    });

  } catch (error) {
    console.error("OpenAI error:", {
      status: error.status,
      message: error.message,
      code: error.code,
      type: error.type
    });
    return res.status(500).json({ reply: "Oops! Something went wrong. Try again later." });
  }
});

export default router;
