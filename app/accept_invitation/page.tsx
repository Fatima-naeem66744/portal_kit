"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invitationId = searchParams.get("invitationId");

  const [message, setMessage] = useState("Accepting your invitation...");

  useEffect(() => {
    async function accept() {
      if (!invitationId) {
        setMessage("Invalid invitation link. Missing invitationId.");
        return;
      }

      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        setMessage(error.message || "Failed to accept invitation.");
        return;
      }

      setMessage("Invitation accepted! Taking you to dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    }

    accept();
  }, [invitationId, router]);

  return (
    <main>
      <h1>Accept Invitation</h1>
      <p>{message}</p>
    </main>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<main><h1>Accept Invitation</h1><p>Loading...</p></main>}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
