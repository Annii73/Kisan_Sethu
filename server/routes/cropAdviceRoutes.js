import express from "express";
import { getCropAdvice } from "../controllers/cropAdviceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, getCropAdvice);

export default router;