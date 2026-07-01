import nodemailer from "nodemailer";

let transporter;

function getMailTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    throw new Error("Email server credentials are not configured.");
  }

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD
    }
  });

  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM is not configured.");
  }

  return getMailTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html
  });
}
