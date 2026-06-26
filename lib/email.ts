import 'server-only';
import nodemailer from 'nodemailer';
import type { TeamRole } from '@/lib/team-roles';
import { TEAM_ROLE_LABELS } from '@/lib/team-roles';

type InvitationEmailParams = {
  to: string;
  teamName: string;
  inviterName: string;
  role: TeamRole;
  inviteLink: string;
  signInLink: string;
};

function getSmtpConfig() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s/g, '');

  if (!user || !pass) {
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT || '465', 10);

  return {
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass },
    from: process.env.SMTP_FROM?.trim() || user,
  };
}

export function isEmailConfigured(): boolean {
  return getSmtpConfig() !== null;
}

export async function sendInvitationEmail(
  params: InvitationEmailParams
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = getSmtpConfig();
  if (!config) {
    return {
      ok: false,
      error:
        'Email is not configured. Add SMTP_USER and SMTP_PASS to your .env file.',
    };
  }

  const roleLabel = TEAM_ROLE_LABELS[params.role];
  const subject = `You're invited to join ${params.teamName} on Forget Me Not`;

  const text = `Hello,

${params.inviterName} invited you to join "${params.teamName}" on Forget Me Not as a ${roleLabel}.

If you don't have an account yet, create one here:
${params.inviteLink}

If you already have an account, sign in and accept the invitation on your teams page:
${params.signInLink}

— Forget Me Not`;

  const html = `<!DOCTYPE html>
<html>
  <body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1f2937;">
    <p>Hello,</p>
    <p>
      <strong>${escapeHtml(params.inviterName)}</strong> invited you to join
      <strong>${escapeHtml(params.teamName)}</strong> on Forget Me Not as a
      <strong>${escapeHtml(roleLabel)}</strong>.
    </p>
    <p>
      <a href="${params.inviteLink}" style="display: inline-block; background: #0284c7; color: #fff; padding: 12px 20px; border-radius: 9999px; text-decoration: none; font-weight: 600;">
        Create account &amp; join
      </a>
    </p>
    <p style="font-size: 14px; color: #4b5563;">
      Already have an account?
      <a href="${params.signInLink}">Sign in</a> and accept the invitation on your teams page.
    </p>
    <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">Forget Me Not</p>
  </body>
</html>`;

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    await transporter.sendMail({
      from: config.from,
      to: params.to,
      subject,
      text,
      html,
    });

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown email error';
    console.error('Failed to send invitation email:', message);
    return { ok: false, error: `Could not send invitation email: ${message}` };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
