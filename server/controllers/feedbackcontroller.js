import Feedback from "../models/Feedback.js";

export const submitFeedback = async (req, res) => {
  try {
    const { rating, category, message, suggestions } = req.body;

    if (!rating || !category || !message) {
      return res.status(400).json({
        success: false,
        message: "Rating, category and message are required",
      });
    }

    const feedback = await Feedback.create({
      user: req.user.id,
      rating,
      category,
      message,
      suggestions,
    });

    res.status(201).json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};