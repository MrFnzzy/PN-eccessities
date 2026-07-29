import nodemailer from "nodemailer";

// The staff member responsible for the school inbox supplies SMTP_* in .env
// (see .env.example). Works out of the box with a Gmail App Password, or any
// other SMTP provider (Outlook, school Google Workspace, Zoho, etc).
function getTransport() {
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

const FROM = () =>
  `"${process.env.SMTP_FROM_NAME || "Campus Companion"}" <${process.env.SMTP_USER}>`;

export async function sendReceiptConfirmationEmail(opts: {
  to: string;
  studentName: string;
  periodLabel: string;
  staffComment?: string | null;
}) {
  const transport = getTransport();
  await transport.sendMail({
    from: FROM(),
    to: opts.to,
    subject: `Receipt confirmed - ${opts.periodLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#22BBEA">Receipt Confirmed</h2>
        <p>Hi ${opts.studentName},</p>
        <p>Your counterpart receipt for <strong>${opts.periodLabel}</strong> has been reviewed and confirmed.</p>
        ${opts.staffComment ? `<p style="background:#f5f5f5;padding:12px;border-radius:8px"><strong>Staff comment:</strong> ${opts.staffComment}</p>` : ""}
        <p style="color:#404040;font-size:13px">This is an automatic confirmation. No reply needed.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(opts: { to: string; resetUrl: string }) {
  const transport = getTransport();
  await transport.sendMail({
    from: FROM(),
    to: opts.to,
    subject: "Reset your password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#22BBEA">Reset your password</h2>
        <p>Click the button below to set a new password. This link expires in 1 hour.</p>
        <p><a href="${opts.resetUrl}" style="background:#FF9933;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block">Reset Password</a></p>
        <p style="color:#404040;font-size:13px">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}
