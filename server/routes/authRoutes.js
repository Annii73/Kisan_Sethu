import express from "express";
import { body, validationResult } from "express-validator";
import {
  register,
  login,
  getMe,
  updateProfile,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }
  next();
};

router.post("/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  handleValidationErrors,
  register
);

router.post("/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  handleValidationErrors,
  login
);

router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateProfile);

export default router;