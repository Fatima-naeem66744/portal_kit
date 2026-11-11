import { db } from "@/database";
import { countDistinct, count, eq } from "drizzle-orm";
import { member } from "@/auth-schema";
import { organization } from "@/auth-schema";

async function main() {
  const orgs = await db.select().from(organization);
  console.log("Organizations:");
  for (const org of orgs) {
    const [{ count: uniqueCount }] = await db
      .select({ count: countDistinct(member.userId) })
      .from(member)
      .where(eq(member.organizationId, org.id));
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(member)
      .where(eq(member.organizationId, org.id));
    console.log(
      `Org ${org.name} (${org.id}): ${Number(uniqueCount)} unique / ${Number(
        totalCount
      )} total rows`
    );
  }
}

main();
