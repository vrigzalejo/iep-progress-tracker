import { APP_NAME } from "@/lib/brand";
import { captureError } from "@/lib/monitoring";
import { appOrigin } from "@/lib/runtime";

export function mailConfigured(env: NodeJS.Dict<string> = process.env) {
  return Boolean(env.SMTP_HOST?.trim() && (env.MAIL_FROM?.trim() || env.SMTP_USER?.trim()));
}

type MailInput = {
  to: string;
  subject: string;
  text: string;
};

async function sendSmtp(input: MailInput, env: NodeJS.Dict<string> = process.env) {
  const nodemailer = await import("nodemailer");
  const port = Number(env.SMTP_PORT || "587");
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth:
      env.SMTP_USER?.trim() && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
  });
  const from = env.MAIL_FROM?.trim() || env.SMTP_USER?.trim();
  if (!from) return false;
  await transporter.sendMail({
    from: `${APP_NAME} <${from}>`,
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
  return true;
}

export async function sendTransactionalMail(input: MailInput) {
  if (!mailConfigured()) return false;
  try {
    return await sendSmtp(input);
  } catch (error) {
    captureError(error, { mail: "failed" });
    return false;
  }
}

export function signInUrl() {
  return `${appOrigin()}/sign-in`;
}

export async function sendTeamInviteMail(to: string, roleLabel: string) {
  return sendTransactionalMail({
    to,
    subject: `You were added to ${APP_NAME}`,
    text: [
      `An administrator added this email to ${APP_NAME} as ${roleLabel}.`,
      `Sign in: ${signInUrl()}`,
      "This message does not include student records.",
    ].join("\n"),
  });
}

export async function sendFamilyMessageMail(to: string) {
  return sendTransactionalMail({
    to,
    subject: `New family message in ${APP_NAME}`,
    text: [
      `There is a new family-thread message in ${APP_NAME}.`,
      `Sign in to read it: ${signInUrl()}`,
      "The message itself is not included in this email.",
    ].join("\n"),
  });
}

export async function sendReportingWindowMail(to: string) {
  return sendTransactionalMail({
    to,
    subject: `A reporting window is open in ${APP_NAME}`,
    text: [
      `A progress reporting window has opened in ${APP_NAME}.`,
      `Sign in to write period comments: ${appOrigin()}/reports`,
      "This message does not include student records.",
    ].join("\n"),
  });
}
