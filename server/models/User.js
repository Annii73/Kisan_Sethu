import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
  },

  // ========= Profile =========
  location: {
    type: String,
    default: "",
  },

  farmSize: {
    type: Number,
    default: 0,
  },

  soilType: {
    type: String,
    default: "",
  },

  isProfileComplete: {
    type: Boolean,
    default: false,
  },

}, {
  timestamps: true,
});

const User = mongoose.model("User", userSchema);

export default User;