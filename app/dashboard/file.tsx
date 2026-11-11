"use client";

import { useState } from "react";
import { createFileUploadUrlAction, createAttachmentAction } from "./action";

type FileUploadProps = {
  taskId?: string;
};

export default function FileUpload({ taskId }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;

    try {
      setUploading(true);

      // 1. Ask our server for a temporary upload URL
      const { url, key } = await createFileUploadUrlAction({
  taskId,
  fileName: file.name,
  contentType: file.type,
  filesize: file.size,
});

      console.log("SIGNED URL HOST:", new URL(url).host);
      console.log("STORAGE KEY:", key);

      // 2. Upload the actual file directly to Neon Object Storage
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      // 3. Save the attachment record
      await createAttachmentAction({
        taskId,
        fileName: file.name,
        fileKey: key,
        contentType: file.type,
        size: file.size,
      });

      console.log("Upload successful!");
      console.log("Storage key:", key);

      setUploadedFile(file.name);
      alert("File uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        type="file"
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
        }}
      />
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? "Uploading..." : "Upload File"}
      </button>

      {uploadedFile && <p>Uploaded: {uploadedFile}</p>}
    </div>
  );
}
