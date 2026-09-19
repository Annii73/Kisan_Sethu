import express from "express";
import { getPestDetection } from "../controllers/pestDetectionController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, getPestDetection);

export default router;