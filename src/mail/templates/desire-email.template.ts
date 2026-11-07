export interface DesireEmailTemplateOptions {
  eyebrow?: string;
  title: string;
  message: string;
  content?: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function desireEmailTemplate({
  eyebrow = 'DESIRE',
  title,
  message,
  content = '',
  buttonText,
  buttonUrl,
  footerText = 'Luxury designed with intention.',
}: DesireEmailTemplateOptions): string {
  const safeEyebrow =
    escapeHtml(eyebrow);

  const safeTitle =
    escapeHtml(title);

  const safeMessage =
    escapeHtml(message);

  const safeFooter =
    escapeHtml(footerText);

  const button =
    buttonText && buttonUrl
      ? `
        <table
          role="presentation"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="margin-top:32px;"
        >
          <tr>
            <td
              style="
                background:#111111;
                border-radius:4px;
              "
            >
              <a
                href="${escapeHtml(buttonUrl)}"
                style="
                  display:inline-block;
                  padding:15px 26px;
                  font-family:Arial,sans-serif;
                  font-size:13px;
                  font-weight:600;
                  letter-spacing:0.04em;
                  color:#ffffff;
                  text-decoration:none;
                "
              >
                ${escapeHtml(buttonText)}
              </a>
            </td>
          </tr>
        </table>
      `
      : '';

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <title>${safeTitle}</title>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f5f5f3;
        "
      >
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width:100%;
            background:#f5f5f3;
          "
        >
          <tr>
            <td
              align="center"
              style="padding:40px 16px;"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  width:100%;
                  max-width:620px;
                  background:#ffffff;
                  border:1px solid #e7e7e3;
                "
              >
                <tr>
                  <td
                    align="center"
                    style="
                      padding:34px 30px;
                      border-bottom:1px solid #eeeeea;
                    "
                  >
                    <div
                      style="
                        font-family:Georgia,'Times New Roman',serif;
                        font-size:30px;
                        letter-spacing:0.18em;
                        color:#111111;
                      "
                    >
                      DESIRE
                    </div>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:46px 42px 48px;
                    "
                  >
                    <div
                      style="
                        margin-bottom:14px;
                        font-family:Arial,sans-serif;
                        font-size:11px;
                        font-weight:700;
                        letter-spacing:0.16em;
                        color:#777777;
                      "
                    >
                      ${safeEyebrow}
                    </div>

                    <h1
                      style="
                        margin:0 0 22px;
                        font-family:Georgia,'Times New Roman',serif;
                        font-size:32px;
                        line-height:1.2;
                        font-weight:400;
                        color:#111111;
                      "
                    >
                      ${safeTitle}
                    </h1>

                    <p
                      style="
                        margin:0;
                        font-family:Arial,sans-serif;
                        font-size:15px;
                        line-height:1.8;
                        color:#555555;
                      "
                    >
                      ${safeMessage}
                    </p>

                    ${
                      content
                        ? `
                          <div
                            style="
                              margin-top:28px;
                              font-family:Arial,sans-serif;
                              font-size:14px;
                              line-height:1.7;
                              color:#333333;
                            "
                          >
                            ${content}
                          </div>
                        `
                        : ''
                    }

                    ${button}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:26px 42px;
                      background:#111111;
                    "
                  >
                    <p
                      style="
                        margin:0 0 6px;
                        font-family:Arial,sans-serif;
                        font-size:12px;
                        line-height:1.6;
                        color:#ffffff;
                      "
                    >
                      DESIRE
                    </p>

                    <p
                      style="
                        margin:0;
                        font-family:Arial,sans-serif;
                        font-size:11px;
                        line-height:1.6;
                        color:#aaaaaa;
                      "
                    >
                      ${safeFooter}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}