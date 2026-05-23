import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = 'Ahaget <hello@ahaget.ai>';
const DASHBOARD_URL = process.env.FRONTEND_URL ?? 'https://app.ahaget.ai';

export async function sendMagicLinkEmail(params: {
  to: string;
  name: string;
  magicUrl: string;
}) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping magic-link email');
    console.info(`[email] Magic link (dev): ${params.magicUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: 'Sign in to Ahaget',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr>
          <td style="background:#6366f1;padding:28px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Ahaget</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;color:#1e293b;font-size:16px;font-weight:600;">Hi ${params.name},</p>
            <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.6;">
              Click the button below to sign in to your Ahaget account. This link expires in 15 minutes.
            </p>
            <a href="${params.magicUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">
              Sign in to Ahaget →
            </a>
            <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}



export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  orgName: string;
  apiKey: string;
}) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping welcome email');
    return;
  }

  const snippet = `<!-- Ahaget Widget -->
<script src="https://cdn.ahaget.ai/widget.js"></script>
<script>
  Ahaget('init', {
    apiKey: '${params.apiKey}',
    userId: currentUser.id,
    metadata: { plan: currentUser.plan },
  });
</script>`;

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Welcome to Ahaget — here's your API key`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#6366f1;padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Ahaget</h1>
            <p style="margin:4px 0 0;color:#c7d2fe;font-size:13px;">Your AI employee — activate, retain, expand</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Hi ${params.name},</p>
            <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
              Welcome to Ahaget! Your account for <strong>${params.orgName}</strong> is ready.
              Paste the snippet below into your app and the AI agent will start guiding users to first value.
            </p>

            <!-- API Key box -->
            <div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0 0 6px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your API Key</p>
              <code style="color:#6366f1;font-size:13px;font-family:monospace;word-break:break-all;">${params.apiKey}</code>
            </div>

            <!-- Snippet box -->
            <p style="margin:0 0 10px;color:#1e293b;font-size:14px;font-weight:600;">Embed snippet</p>
            <div style="background:#0f172a;border-radius:8px;padding:16px 20px;margin-bottom:28px;overflow:hidden;">
              <pre style="margin:0;color:#e2e8f0;font-size:12px;font-family:monospace;white-space:pre-wrap;line-height:1.6;">${snippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </div>

            <!-- Steps -->
            <p style="margin:0 0 12px;color:#1e293b;font-size:14px;font-weight:600;">Your AI employee in 2 lines</p>
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
              ${['Paste the snippet before </body> on every page', 'Replace <code>currentUser.id</code> with your user\'s ID', 'Open your app — the AI widget appears after 30 seconds'].map((text, i) => `
              <tr>
                <td style="padding:6px 0;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:28px;height:28px;background:#ede9fe;border-radius:50%;text-align:center;vertical-align:middle;">
                        <span style="color:#6366f1;font-size:12px;font-weight:700;">${i + 1}</span>
                      </td>
                      <td style="padding-left:12px;color:#475569;font-size:14px;">${text}</td>
                    </tr>
                  </table>
                </td>
              </tr>`).join('')}
            </table>

            <!-- CTA -->
            <a href="${DASHBOARD_URL}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
              Open Dashboard →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              Questions? Reply to this email — we read every one.<br>
              Ahaget · Your AI employee for SaaS
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendContactEmail(params: {
  name: string;
  email: string;
  company?: string;
  useCase?: string;
  message: string;
}) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping contact email');
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: 'hello@ahaget.ai',
    reply_to: params.email,
    subject: `Contact: ${params.name}${params.company ? ` (${params.company})` : ''}`,
    html: `
<p><strong>From:</strong> ${params.name} &lt;${params.email}&gt;</p>
${params.company ? `<p><strong>Company:</strong> ${params.company}</p>` : ''}
${params.useCase ? `<p><strong>Use case:</strong> ${params.useCase}</p>` : ''}
<p><strong>Message:</strong></p>
<p style="white-space:pre-wrap">${params.message}</p>`,
  });
}

export async function sendZeroCompletionAlert(params: {
  to: string;
  orgName: string;
  flowName: string;
  sessionsToday: number;
}) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping zero-completion alert');
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Alert: "${params.flowName}" has had 0 completions today`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#f97316;padding:24px 36px;">
            <span style="color:#ffffff;font-size:18px;font-weight:700;">⚠️ Flow alert — ${params.orgName}</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 16px;color:#1e293b;font-size:15px;line-height:1.6;">
              Your flow <strong>"${params.flowName}"</strong> had
              <strong>${params.sessionsToday} session${params.sessionsToday === 1 ? '' : 's'} started</strong>
              in the last 24 hours but <strong style="color:#ef4444;">0 completions</strong>.
            </p>
            <p style="margin:0 0 28px;color:#64748b;font-size:14px;line-height:1.6;">
              This usually means users are getting stuck or the AI isn't responding correctly.
              Check the failure inbox for stuck sessions and open escalations.
            </p>

            <!-- Stats row -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;background:#fef9f0;border:1px solid #fed7aa;border-radius:8px;padding:16px 20px;">
              <tr>
                <td style="text-align:center;border-right:1px solid #fed7aa;padding-right:20px;">
                  <p style="margin:0;color:#ea580c;font-size:28px;font-weight:700;">${params.sessionsToday}</p>
                  <p style="margin:4px 0 0;color:#9a3412;font-size:12px;">Sessions started</p>
                </td>
                <td style="text-align:center;padding-left:20px;">
                  <p style="margin:0;color:#ef4444;font-size:28px;font-weight:700;">0%</p>
                  <p style="margin:4px 0 0;color:#9a3412;font-size:12px;">Completion rate</p>
                </td>
              </tr>
            </table>

            <div style="display:flex;gap:12px;">
              <a href="${DASHBOARD_URL}/failures" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:600;margin-right:12px;">
                View failure inbox →
              </a>
              <a href="${DASHBOARD_URL}/flows" style="display:inline-block;background:#f1f5f9;color:#475569;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #e2e8f0;">
                Review flow
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 36px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:11px;">
              Ahaget · You'll only receive this alert once per flow per 24 hours.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

/**
 * sendProactiveEmail — out-of-app re-engagement email sent by the AI employee.
 * Contains a deep link back into the product with ?ahaget_resume=<flowId>.
 * Tracks open + click via a 1x1 pixel and link redirect (future).
 */
export async function sendProactiveEmail(params: {
  to: string;
  userName?: string;
  subject: string;
  bodyHtml: string;   // pre-rendered message body HTML (injected into template)
  deepLink: string;   // full URL with ?ahaget_resume=<flowId>
  unsubscribeUrl: string;
}) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping proactive email');
    console.info(`[email][proactive] Would send to ${params.to}: ${params.subject}`);
    console.info(`[email][proactive] Deep link: ${params.deepLink}`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#FF857A,#EBAEE6);padding:24px 36px;display:flex;align-items:center;gap:10px;">
            <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Ahaget</span>
            <span style="color:rgba(255,255,255,0.75);font-size:13px;">· Your AI employee</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            ${params.userName ? `<p style="margin:0 0 16px;color:#1e293b;font-size:15px;">Hi ${params.userName},</p>` : ''}
            ${params.bodyHtml}

            <!-- CTA -->
            <div style="margin-top:28px;">
              <a href="${params.deepLink}"
                 style="display:inline-block;background:linear-gradient(135deg,#FF857A,#EBAEE6);color:#3d1008;text-decoration:none;padding:13px 28px;border-radius:9px;font-size:15px;font-weight:700;">
                Resume where you left off →
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 36px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
              You're receiving this because your account is set up with AI-powered lifecycle assistance.<br>
              <a href="${params.unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}


