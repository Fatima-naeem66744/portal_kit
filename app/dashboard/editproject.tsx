"use client";

import { updateProjectAction } from "./action";

export default function EditProjectForm({
  project,
}: {
  project: {
    id: string;
    name: string;
    description: string | null;
  };
}) {
  return (
    <form
      action={async (formData) => {
        await updateProjectAction(project.id, formData);
        window.location.reload();
      }}
    >
      <input
        name="name"
        defaultValue={project.name}
      />

      <textarea
        name="description"
        defaultValue={project.description ?? ""}
      />

      <button type="submit">
        Save
      </button>
    </form>
  );
}