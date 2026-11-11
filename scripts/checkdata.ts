import { db } from "@/database";
import { organization, user } from "@/auth-schema";

async function main() {
  const organizations = await db.select().from(organization);
  const users = await db.select().from(user);

  console.log("ORGANIZATIONS:");
  console.log(organizations);

  console.log("USERS:");
  console.log(users);
}

main().catch(console.error);