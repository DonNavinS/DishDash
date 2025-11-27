import { createTransport } from 'nodemailer';

interface EmailParams {
  identifier: string;
  url: string;
  provider: {
    server?: any;
    from?: string;
  };
}

export async function sendMagicLinkEmail(params: EmailParams) {
  const { identifier: email, url, provider } = params;
  const { server, from } = provider;

  const transport = createTransport(server);

  const result = await transport.sendMail({
    to: email,
    from,
    subject: 'Sign in to DishDash',
    text: textEmail({ url, email }),
    html: htmlEmail({ url, email }),
  });

  const failed = result.rejected?.filter(Boolean) || [];
  if (failed.length) {
    throw new Error(`Email failed to send to: ${failed.join(', ')}`);
  }
}

function textEmail({ url, email }: { url: string; email: string }) {
  return `Sign in to DishDash\n\nClick the link below to sign in:\n${url}\n\nIf you didn't request this email, you can safely ignore it.\n\nThis link expires in 24 hours.`;
}

function htmlEmail({ url, email }: { url: string; email: string }) {
  const brandColor = '#f97316'; // Orange-500 for DishDash branding
  const buttonBackgroundColor = brandColor;
  const buttonTextColor = '#ffffff';

  return `
    <body style="background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 32px;">
                  <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #111827;">
                    🍽️ Sign in to DishDash
                  </h1>
                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4b5563;">
                    Click the button below to sign in to your account:
                  </p>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center">
                        <a href="${url}" target="_blank" style="display: inline-block; padding: 12px 32px; background-color: ${buttonBackgroundColor}; color: ${buttonTextColor}; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          Sign in to DishDash
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                    Or copy and paste this URL into your browser:
                  </p>
                  <p style="margin: 8px 0 0; font-size: 14px; word-break: break-all; color: #3b82f6;">
                    ${url}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9ca3af;">
                    If you didn't request this email, you can safely ignore it.
                    <br/>
                    This link expires in 24 hours.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  `;
}
