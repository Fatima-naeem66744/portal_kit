import { headers } from "next/headers";
import { db } from "@/database/index";
import { organization } from "@/auth-schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TenantProvider({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const tenantSlug = headerStore.get("x-tenant-slug");

  let tenant = null;
  if (tenantSlug) {
    const rows = await db.select().from(organization).where(eq(organization.slug, tenantSlug)).limit(1);
    tenant = rows[0] ?? null;
  }

  return (
    <div data-tenant={tenantSlug ?? "default"} data-tenant-name={tenant?.name}>
      {children}
    </div>
  );
}
