import React, { useState } from "react";
import { Sprout } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
const Login = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">

        <div className="flex justify-center mb-5">
          <Sprout className="text-green-600" size={50} />
        </div>

        <h1 className="text-3xl font-bold text-center mb-6">
          Kisaan Sethu Login
        </h1>

        <form onSubmit={handleSubmit}>

          <input
            type="email"
            placeholder="Enter Email"
            className="w-full border p-3 rounded mb-4"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Enter Password"
            className="w-full border p-3 rounded mb-4"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-500 mb-3">{error}</p>
          )}

<button
  className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700"
  disabled={loading}
>
  {loading ? "Logging in..." : "Login"}
</button>

<p className="text-center mt-5">
  Don't have an account?

  <Link
    to="/register"
    className="text-green-600 font-bold ml-2"
  >
    Register
  </Link>
</p>

        </form>

      </div>
    </div>
  );
};

export default Login;