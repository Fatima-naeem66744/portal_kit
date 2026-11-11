"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { checkMemberLimitAction } from "../action";

export default function InviteForm({organizationId}: {organizationId: string}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("Sending invite...");

    const limitCheck = await checkMemberLimitAction();

    if (!limitCheck.allowed) {
      setMessage(limitCheck.error);
      setLoading(false);
      return;
    }
    setMessage("Sending invite...");

    const { error } = await authClient.organization.inviteMember({
      email,
      role: "member",
      organizationId,
    });

    if (error) {
      setMessage(error.message || "Failed to send invite");
      setLoading(false);
      return;
    }

    setMessage("Invite sent successfully!");
    setEmail("");
    setLoading(false);
  }

  return (
    <div className="invite-form">
      <h2 style={{ margin: "0 0 12px", fontSize: "18px", color: "#111827" }}>
        Invite a member
      </h2>
      <form onSubmit={handleInvite} className="form-row">
        <input
          type="email"
          placeholder="teammate@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="form-input"
        />
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Sending…" : "Invite"}
        </button>
      </form>
      {message && (
        <p
          className={`auth-message ${message.includes("successfully") ? "success" : message.includes("failed") || message.includes("allows") ? "error" : "info"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
