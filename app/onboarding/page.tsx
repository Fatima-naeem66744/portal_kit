"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleCreateOrganization(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const slug = name.toLowerCase().trim().replace(/\s+/g, "-");

    const { data, error: err } = await authClient.organization.create({ name, slug });

    if (err) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
      return;
    }

    console.log("Organization created:", data);
    router.push("/dashboard");
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create your workspace</h1>
          <p>Your workspace is your PortalKit organization</p>
        </div>

        <form className="auth-form" onSubmit={handleCreateOrganization}>
          <div className="form-group">
            <label htmlFor="name">Workspace name</label>
            <input
              id="name"
              type="text"
              placeholder="My Agency"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Creating workspace…" : "Create workspace"}
          </button>
        </form>

        {error && <p className="auth-message error">{error}</p>}
      </div>
    </div>
  );
}
