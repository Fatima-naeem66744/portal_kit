"use client";

import { createCommentAction } from "./action";

type CommentFormProps = {
  taskId: string;
};

export default function CommentForm({
  taskId,
}: CommentFormProps) {
  return (
    <form
      className="comment-form"
      action={createCommentAction.bind(null, taskId)}
    >
      <textarea
        name="content"
        placeholder="Write a comment..."
        required
      />

      <button type="submit">
        Add Comment
      </button>
    </form>
  );
}