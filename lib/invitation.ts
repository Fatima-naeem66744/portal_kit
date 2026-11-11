import 'server-only';
import { Resend } from 'resend';
import type { ReactElement } from "react";


type sendEmailParams = {
  to: string;
  subject: string;
  react: ReactElement;
};
export default async function sendEmail({ to , subject, react }: sendEmailParams) {
  if(!process.env.RESEND_API_KEY) {
        throw new Error('Resend API key is not set');

  }
  

  const resend = new Resend(process.env.RESEND_API_KEY);
  const {data , error} = await resend.emails.send({
    from:  "PortalKit <onboarding@resend.dev>",
    to,
    subject,
    react,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;

}