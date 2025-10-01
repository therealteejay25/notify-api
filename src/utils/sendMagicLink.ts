import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendMagicLink = async (email: string, token: string) => {
  const link = `http://localhost:9000/auth/callback?token=${token}`; 
  await transporter.sendMail({
    from: `"Notify" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your secure magic link to sign in",
    text: `Sign in to Notify: ${link}\n\nThis link expires in 15 minutes. If you didn’t request this, just ignore this email.`,
  });
};
