import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  suggestions: {
    type: String,
    default: "",
  },
}, {
  timestamps: true,
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;