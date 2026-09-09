import { APP_NAME } from "@/lib/brand";
import { captureError } from "@/lib/monitoring";
import { appOrigin } from "@/lib/runtime";

const RESEND_PLACEHOLDER_KEY = "re_xxxxxxxxx";

function trimEnv(value: string | undefined) {
  return value?.trim() || "";
}

function mailFrom(env: NodeJS.Dict<string>) {
  return trimEnv(env.MAIL_FROM) || trimEnv(env.SMTP_USER);
}

function fromHeader(from: string) {
  return from.includes("<") ? from : `${APP_NAME} <${from}>`;
}

export function smtpConfigured(env: NodeJS.Dict<string> = process.env) {
  return Boolean(trimEnv(env.SMTP_HOST) && mailFrom(env));
}

export function resendConfigured(env: NodeJS.Dict<string> = process.env) {
  const key = trimEnv(env.RESEND_API_KEY);
  return Boolean(key && key !== RESEND_PLACEHOLDER_KEY && mailFrom(env));
}

export function mailConfigured(env: NodeJS.Dict<string> = process.env) {
  return resendConfigured(env) || smtpConfigured(env);
}

type MailInput = {
  to: string;
  subject: string;
  text: string;
};

function textToHtml(text: string) {
  const escaped = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return `<p>${escaped.replaceAll("\n", "<br>")}</p>`;
}

async function sendResend(input: MailInput, env: NodeJS.Dict<string> = process.env) {
  const apiKey = trimEnv(env.RESEND_API_KEY);
  const from = mailFrom(env);
  if (!apiKey || !from) return false;
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: fromHeader(from),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: textToHtml(input.text),
  });
  if (error) {
    captureError(new Error("resend send failed"), { mail: "failed" });
    return false;
  }
  return true;
}

async function sendSmtp(input: MailInput, env: NodeJS.Dict<string> = process.env) {
  const nodemailer = await import("nodemailer");
  const port = Number(env.SMTP_PORT || "587");
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth:
      trimEnv(env.SMTP_USER) && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
  });
  const from = mailFrom(env);
  if (!from) return false;
  await transporter.sendMail({
    from: fromHeader(from),
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
  return true;
}

export async function sendTransactionalMail(input: MailInput) {
  if (!mailConfigured()) return false;
  try {
    if (resendConfigured()) return await sendResend(input);
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

export async function sendAccountDeactivatedMail(to: string) {
  return sendTransactionalMail({
    to,
    subject: `Sign-in is off for this email in ${APP_NAME}`,
    text: [
      `An administrator turned off sign-in for this email in ${APP_NAME}.`,
      "You cannot sign in until an administrator restores access.",
      "This message does not include student records.",
    ].join("\n"),
  });
}

export async function sendAccountReactivatedMail(to: string) {
  return sendTransactionalMail({
    to,
    subject: `Sign-in was restored in ${APP_NAME}`,
    text: [
      `An administrator restored sign-in for this email in ${APP_NAME}.`,
      `Sign in: ${signInUrl()}`,
      "This message does not include student records.",
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
