import { NextResponse, type NextRequest } from "next/server";

const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  let tenantSlug: string | null = null;

  if (hostname.endsWith(`.${rootDomain}`)) {
    tenantSlug = hostname.slice(0, -(rootDomain.length + 1));
  }

  const requestHeaders = new Headers(request.headers);

  if (tenantSlug && tenantSlug !== "www") {
    requestHeaders.set("x-tenant-slug", tenantSlug);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
