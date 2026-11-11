"use client";

import { startTransition, useOptimistic } from "react";
import { updateTaskStatusAction } from "./action";

type TaskItemProps = {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
  };
};
export default function TaskItem({ task }: TaskItemProps) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status);

  function changeStatus(newStatus: string) {
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      await updateTaskStatusAction(task.id, newStatus);
    });
  }

  return (
    <div className="task-main">
      <div className="task-head">
        <strong>{task.title}</strong>
        <span className={`task-status ${optimisticStatus}`}>
          {optimisticStatus}
        </span>
      </div>

      {task.description && (
        <p className="task-description">
          {task.description}
        </p>
      )}

      <div className="task-actions">
        {optimisticStatus === "todo" && (
          <button
            type="button"
            onClick={() => changeStatus("in-progress")}
          >
            Start Task
          </button>
        )}

        {optimisticStatus === "in-progress" && (
          <button
            type="button"
            onClick={() => changeStatus("done")}
          >
            Complete Task
          </button>
        )}

        {optimisticStatus === "done" && (
          <button
            type="button"
            onClick={() => changeStatus("todo")}
          >
            Reopen Task
          </button>
        )}
      </div>
    </div>
  );
}
