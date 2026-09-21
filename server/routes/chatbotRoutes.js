import express from "express";
import { getChatbotResponse } from "../controllers/chatbotController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, getChatbotResponse);

export default router;