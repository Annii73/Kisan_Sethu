import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API = "http://localhost:5001/api/auth";
// Agar backend 5001 pe hai to upar 5000 ki jagah 5001 kar dena.

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const checkUser = async () => {

        const token = localStorage.getItem("token");

        if(!token){
            setLoading(false);
            return;
        }

        try{

          const res = await axios.get(`${API}/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          console.log("USER OBJECT:", res.data.user);
          console.log("PROFILE COMPLETE:", res.data.user.isProfileComplete);

          setUser(res.data.user);

        } catch(err){
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            // Token is genuinely invalid/expired — safe to log out
            localStorage.removeItem("token");
            localStorage.removeItem("kisaan_user");
            setUser(null);
          } else {
            // Server unreachable (network error) — don't log out, just show connection issue
            console.error("Cannot reach server:", err.message);
            setUser(null);
          }
      }

        setLoading(false);

    };

    checkUser();

},[]);
  // ===========================
  // LOGIN
  // ===========================

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API}/login`, {
        email,
        password,
      });

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("kisaan_user", JSON.stringify(user));

      setUser(user);

      return {
        success: true,
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Login Failed",
      };
    }
  };

  // ===========================
  // UPDATE PROFILE
  // (Abhi isi tarah rehne do)
  // ===========================

  const updateProfile = async (profileData) => {
    try {
      const token = localStorage.getItem("token");
  
      const res = await axios.put(
        `${API}/profile`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      setUser(res.data.user);
  
      localStorage.setItem(
        "kisaan_user",
        JSON.stringify(res.data.user)
      );
  
      return {
        success: true,
      };
    } catch (err) {
      console.error(err);
  
      return {
        success: false,
        message: err.response?.data?.message || "Profile update failed",
      };
    }
  };

  // ===========================
  // LOGOUT
  // ===========================

  const logout = () => {
    setUser(null);

    localStorage.removeItem("kisaan_user");
    localStorage.removeItem("token");
  };

  const value = {
    user,
    login,
    logout,
    updateProfile,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

