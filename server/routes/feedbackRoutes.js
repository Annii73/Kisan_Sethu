import express from "express";
import { submitFeedback } from "../controllers/feedbackController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, submitFeedback);

export default router;
