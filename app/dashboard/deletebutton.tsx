"use client";

import { useState } from "react";
import { deleteProjectAction } from "./action";

export default function DeleteProjectButton({
  projectId,
}: {
  projectId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");

    try {
      const result = await deleteProjectAction(projectId);

      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      window.location.reload();
    } catch {
      setError("Could not delete project. Please refresh and try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleDelete} disabled={loading}>
        {loading ? "Deleting..." : "Delete"}
      </button>

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
