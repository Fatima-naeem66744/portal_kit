"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const { error } = await authClient.signIn.email({ email, password });

    if (error) {
      setMessage(error.message || "Login failed");
      return;
    }

    setMessage("Logged in successfully!");
    router.push("/dashboard");
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to your PortalKit account</p>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="auth-btn">Sign in</button>
        </form>

        {message && (
          <p className={`auth-message ${message.includes("successfully") ? "success" : "error"}`}>
            {message}
          </p>
        )}

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link href="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
