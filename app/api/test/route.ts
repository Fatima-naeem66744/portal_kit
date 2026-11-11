import { createUploadUrl } from "@/lib/storage";

export async function GET() {
  const url = await createUploadUrl({
    key: "test/hello.txt",
    contentType: "text/plain",
  });

  return Response.json({
    success: true,
    url,
  });
}