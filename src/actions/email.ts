"use server";

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper to wrap sendMail in a promise
async function sendMail(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("CRITICAL: EMAIL_USER or EMAIL_PASS not defined!");
    return { success: false, error: "Configuration Error: Missing Gmail Credentials" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Waitly" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log("Email sent successfully:", info.messageId);
    return { success: true, data: info };
  } catch (error) {
    console.error("Nodemailer Error:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(email: string, verificationLink?: string) {
  return sendMail(
    email,
    'Verify your Waitly Account',
    `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border-radius: 16px; border: 1px solid #f1f5f9;">
        <h1 style="color: #0f172a; letter-spacing: -1px; margin-bottom: 20px; font-size: 32px;">Welcome to Waitly.</h1>
        <p style="color: #64748b; line-height: 1.6; font-size: 16px;">
          We're thrilled to have you. Please verify your email to access your dashboard.
        </p>
        
        <div style="margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #4f46e5; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
            Verify My Account
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
          Or copy this link: <br/>
          <a href="${verificationLink}" style="color: #4f46e5; word-break: break-all;">${verificationLink}</a>
        </p>
      </div>
    `
  );
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  return sendMail(
    email,
    'Reset your Waitly Password',
    `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border-radius: 16px; border: 1px solid #f1f5f9;">
        <h1 style="color: #0f172a; letter-spacing: -1px; margin-bottom: 20px;">Password Reset Request</h1>
        <p style="color: #64748b; line-height: 1.6;">
          We received a request to reset your password. Click the button below to choose a new one.
        </p>
        
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #ef4444; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);">
            Reset Password
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
          If you didn't ask for this, you can ignore this email.
        </p>
      </div>
    `
  );
}

export async function sendDeletionConfirmationEmail(email: string, businessName: string, deleteLink: string) {
  return sendMail(
    email,
    `⚠️ Confirm Deletion: ${businessName}`,
    `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border-radius: 16px; border: 1px solid #fecaca;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px;">🗑️</span>
          </div>
        </div>
        
        <h1 style="color: #dc2626; letter-spacing: -1px; margin-bottom: 20px; text-align: center; font-size: 28px;">
          Deletion Request
        </h1>
        
        <p style="color: #64748b; line-height: 1.8; font-size: 16px; text-align: center;">
          You requested to permanently delete your business:
        </p>
        
        <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
          <strong style="color: #dc2626; font-size: 20px;">${businessName}</strong>
        </div>
        
        <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-bottom: 30px;">
          This action is <strong>irreversible</strong>. All queue data and history will be permanently erased.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${deleteLink}" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);">
            Confirm Deletion
          </a>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">
          If you didn't request this, please ignore this email.<br/>
          This link expires in 1 hour.
        </p>
      </div>
    `
  );
}
