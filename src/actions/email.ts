"use server";

import { Resend } from 'resend';

export async function sendWelcomeEmail(email: string, verificationLink?: string) {
  // Move initialization inside the function to avoid module-level errors
  // if the environment variable hasn't loaded yet.
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("CRITICAL: RESEND_API_KEY is not defined in process.env!");
    return { success: false, error: "Configuration Error: Missing SMS/Email API Key" };
  }

  const resend = new Resend(apiKey);

  try {
    console.log("Attempting to send email to:", email, "Link:", verificationLink ? "Present" : "Missing");

    // Default to 'onboarding@resend.dev' if no custom domain is set up yet.
    // This works for testing with the email you signed up to Resend with.
    const fromEmail = 'Waitly <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: 'Verify your Waitly Account',
      html: `
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
      `,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return { success: false, error };
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (e) {
    console.error("Resend Exception:", e);
    return { success: false, error: e };
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "Missing API configuration" };

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Waitly Support <support@resend.dev>', // Or custom domain if available
      to: [email],
      subject: 'Reset your Waitly Password',
      html: `
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
            `,
    });

    if (error) {
      console.error("Resend Reset Error:", error);
      return { success: false, error };
    }
    return { success: true, data };

  } catch (e) {
    return { success: false, error: e };
  }
}

export async function sendDeletionConfirmationEmail(email: string, businessName: string, deleteLink: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "Missing API configuration" };

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Waitly Security <onboarding@resend.dev>',
      to: [email],
      subject: `⚠️ Confirm Deletion: ${businessName}`,
      html: `
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
      `,
    });

    if (error) {
      console.error("Resend Deletion Email Error:", error);
      return { success: false, error };
    }
    return { success: true, data };

  } catch (e) {
    return { success: false, error: e };
  }
}
