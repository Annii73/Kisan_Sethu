import express from "express";
import { getLiveMandiPrices } from "../controllers/mandiController.js";

const router = express.Router();

router.get("/", getLiveMandiPrices);

export default router;