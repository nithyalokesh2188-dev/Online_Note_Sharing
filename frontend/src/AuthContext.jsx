import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "./config";

const AuthContext = createContext();

async function readJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("The backend returned an unexpected response. Confirm it is running on port 5000.");
  }
  return response.json();
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
    token: null,
    sessionExpired: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("userEmail");

    fetch(`${API_BASE_URL}/auth/me`, { credentials: "include" })
      .then(async (response) => {
        const data = await readJson(response);
        if (response.ok && data.user) {
          setAuth({ isAuthenticated: true, user: data.user, token: null, sessionExpired: false });
        }
      })
      .catch(() => {
        setAuth({ isAuthenticated: false, user: null, token: null, sessionExpired: false });
      })
      .finally(() => setIsInitialized(true));
  }, []);

  const login = async (email, password) => {
    if (!email || !password) throw new Error("Email and password are required.");
    if (password.length < 8) throw new Error("Invalid email or password.");

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.message || "Login failed.");
    if (!data.user?.id) throw new Error("The backend did not return a valid user.");

    setAuth({ isAuthenticated: true, user: data.user, token: null, sessionExpired: false });
    return data.user;
  };

  const logout = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.message || "Could not sign out.");
    setAuth({ isAuthenticated: false, user: null, token: null, sessionExpired: false });
  }, []);

  const validateToken = useCallback(() => auth.isAuthenticated, [auth.isAuthenticated]);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, validateToken, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
