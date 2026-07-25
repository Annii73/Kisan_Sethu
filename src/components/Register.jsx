import React, { useState } from "react";
import axios from "axios";
import { Sprout } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api/auth";
// Agar backend 5001 pe hai to 5000 -> 5001

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await axios.post(`${API}/register`, formData);

      alert("Registration Successful!");

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration Failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">

        <div className="flex justify-center mb-5">
          <Sprout className="text-green-600" size={50}/>
        </div>

        <h1 className="text-3xl font-bold text-center mb-6">
          Create Account
        </h1>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="w-full border p-3 rounded mb-4"
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border p-3 rounded mb-4"
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full border p-3 rounded mb-4"
            onChange={handleChange}
            required
          />

          {error && (
            <p className="text-red-500 mb-3">
              {error}
            </p>
          )}

          <button
            className="w-full bg-green-600 text-white p-3 rounded"
            disabled={loading}
          >
            {loading ? "Creating..." : "Register"}
          </button>

        </form>

        <p className="text-center mt-5">
          Already have an account?

          <Link
            to="/login"
            className="text-green-600 font-bold ml-2"
          >
            Login
          </Link>

        </p>

      </div>

    </div>
  );
};

export default Register;