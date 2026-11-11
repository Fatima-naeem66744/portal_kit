import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { eq, sum } from "drizzle-orm";
import { db } from "@/database";
import { attachment } from "@/database/schema";
import { getOrCreateBillingForOrganization } from "@/lib/billing";
import { PLANS, type PlanName } from "@/lib/plan";


const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  // Talk to this S3-compatible endpoint."

    // And Neon gave us that endpoint automatically when we created the bucket.
  endpoint: process.env.AWS_ENDPOINT_URL_S3!,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function createUploadUrl({
  key,
  contentType,
}: {
  key: string;
  contentType: string;
}) {
  const command = new PutObjectCommand({
    Bucket: "uploads",
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: 60 * 5,
  });

  return url;
}

export async function checkstoragelimit({organizationId , filesize} : {
  organizationId : string , 
  filesize : number,
}) {
  const billing = await getOrCreateBillingForOrganization(organizationId);
  const plan = PLANS[billing.plan as PlanName];
  const [result] = await db.select({
    total : sum(attachment.size)
  }).from(attachment).where(eq(attachment.organizationId , organizationId ));
  const usedstorage = Number(result.total ?? 0);
  // Calculate storage after this new upload
  const storageAfterUpload = usedstorage + filesize;
   // Check the plan limit
  if (storageAfterUpload > plan.maxStorageBytes) {
    throw new Error(
      `Your ${plan.name} plan storage limit has been reached.`
    );
     return {
    allowed: true,
    usedStorage: usedstorage,
    maxStorage: plan.maxStorageBytes,
  };


  }


}