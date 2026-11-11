
import { NextResponse } from "next/server";
import sendEmail from "@/lib/invitation";
import { InvitationEmail } from "@/app/emails/email";

export async function POST() {
  // Keep this temporary endpoint available only locally.
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  const to = process.env.RESEND_TEST_TO;

  if (!to) {
    return NextResponse.json(
      { error: "RESEND_TEST_TO is missing" },
      { status: 500 }
    );
  }

  try {
    const data = await sendEmail({
      to,
      subject: "PortalKit test invitation",
      react: InvitationEmail({
        organizationName: "Demo Agency",
        inviterName: "PortalKit Admin",
        invitationUrl: "http://localhost:3000",
      }),
    });

    return NextResponse.json({
      success: true,
      emailId: data?.id,
    });
  } catch (error) {
    console.error("TEST EMAIL ERROR:", error);

    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}
