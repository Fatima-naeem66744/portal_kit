"use client";

import { useActionState } from "react";
import { createProjectAction } from "./action";

const initialState = {
  success: false,
  error: "",
};

export default function ProjectForm() {
  const [state, formAction, isPending] = useActionState(
    createProjectAction,
    initialState
  );

  return (
    <form action={formAction}>
      <input
        name="name"
        placeholder="Project name"
        required
      />

      <textarea
        name="description"
        placeholder="Project description"
      />

      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Project"}
      </button>

      {state.error && (
        <p>
          {state.error}
        </p>
      )}
    </form>
  );
}
