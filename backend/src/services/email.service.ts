import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  static async sendMail({ to, subject, html }: SendMailOptions) {
    const info = await transporter.sendMail({
      from: `"Festival Finance Manager" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId}`);
    return info;
  }

  static async sendOTP(name: string, email: string, otp: string) {
    return this.sendMail({
      to: email,
      subject: `${otp} is your Festival Finance Manager verification code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #0a0a0a; border-radius: 12px; border: 1px solid #222;">
          <h2 style="color: #D4AF37; margin-bottom: 4px; font-size: 22px;">Verify your email</h2>
          <p style="color: #aaa; margin-top: 0;">Hi ${name}, enter the code below in the app to verify your account.</p>
          <div style="background: #111; border: 1px solid #D4AF37; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #D4AF37; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 13px; margin: 0;">⏱ This code expires in <strong style="color: #fff;">10 minutes</strong>.</p>
          <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
          <p style="color: #444; font-size: 11px; margin: 0;">Festival Finance Manager — Automated message. Do not reply.</p>
        </div>
      `,
    });
  }

  static async sendWelcome(name: string, email: string) {
    return this.sendMail({
      to: email,
      subject: 'Welcome to Festival Finance Manager',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #fff; border-radius: 8px;">
          <h2 style="color: #D4AF37;">Welcome, ${name}! 🙏</h2>
          <p>Your account has been created successfully in the <strong>Festival Finance Manager</strong>.</p>
          <p>Your account is currently <strong>pending approval</strong> by an administrator. You will receive another email once access is granted.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      `,
    });
  }

  static async sendPasswordReset(name: string, email: string, resetLink: string) {
    return this.sendMail({
      to: email,
      subject: 'Password Reset - Festival Finance Manager',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #fff; border-radius: 8px;">
          <h2 style="color: #D4AF37;">Reset Your Password</h2>
          <p>Hi ${name}, we received a request to reset your password.</p>
          <p>Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #D4AF37; color: #000; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">Reset Password</a>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px;">If you did not request this, ignore this email. Your password will not change.</p>
        </div>
      `,
    });
  }

  static async sendRoleUpdate(name: string, email: string, newRole: string) {
    return this.sendMail({
      to: email,
      subject: 'Your Role Has Been Updated - Festival Finance Manager',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #fff; border-radius: 8px;">
          <h2 style="color: #D4AF37;">Account Update</h2>
          <p>Hi ${name}, your account role has been updated by an administrator.</p>
          <p>Your new role is: <strong style="color: #D4AF37;">${newRole.replace(/_/g, ' ').toUpperCase()}</strong></p>
          <p>You can now log in and access your dashboard.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      `,
    });
  }
}
