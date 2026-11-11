import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins"
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { InvitationEmail } from "@/app/emails/email";
import sendEmail from "@/lib/invitation";


import { db } from "@/database/index"
import * as schema from "@/auth-schema"

// syntax is taken from https://better-auth.com/docs/installation
export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    basePath: "/auth",
    trustedOrigins: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ],
    database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
  organization({
    async sendInvitationEmail(data) {
      const invitationUrl =
        `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}` +
        `/dashboard/accept-invitation?invitationId=${data.id}`;

      await sendEmail({
        to: data.email,
        subject: `You're invited to join ${data.organization.name}`,
        react: InvitationEmail({
          organizationName: data.organization.name,
          inviterName: data.inviter.user.name || "A PortalKit team member",
          invitationUrl,
        }),
      });
    },
  }),
],
  emailAndPassword: {
    enabled: true,
  }

})