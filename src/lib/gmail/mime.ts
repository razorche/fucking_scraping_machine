export type MimeMessageOptions = {
  from: string;
  fromName?: string;
  to: string;
  toName?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  inReplyTo?: string;
  references?: string[];
  messageId?: string;
  trackingToken?: string;
  appBaseUrl?: string;
};

export function base64UrlEncode(str: string): string {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function encodeMimeHeader(text: string): string {
  if (/^[\x20-\x7E]*$/.test(text)) return text;
  return `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

export function buildRfc2822Message(options: MimeMessageOptions): {
  raw: string;
  rfcMessageId: string;
} {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const messageId =
    options.messageId ??
    `<${Date.now()}.${Math.random().toString(36).slice(2, 9)}@fom-outreach.local>`;

  const fromFormatted = options.fromName
    ? `"${encodeMimeHeader(options.fromName)}" <${options.from}>`
    : options.from;
  const toFormatted = options.toName
    ? `"${encodeMimeHeader(options.toName)}" <${options.to}>`
    : options.to;

  const headers: string[] = [
    `From: ${fromFormatted}`,
    `To: ${toFormatted}`,
    `Subject: ${encodeMimeHeader(options.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
  ];
  if (options.inReplyTo) headers.push(`In-Reply-To: ${options.inReplyTo}`);
  if (options.references?.length) headers.push(`References: ${options.references.join(" ")}`);

  let finalHtml = options.bodyHtml;
  if (options.trackingToken && options.appBaseUrl) {
    const pixelUrl = `${options.appBaseUrl}/api/tracking/open/${options.trackingToken}`;
    const pixelTag = `<img src="${pixelUrl}" width="1" height="1" style="display:none !important;" alt="" />`;
    finalHtml = finalHtml
      ? `${finalHtml}\n${pixelTag}`
      : `<div>${options.bodyText.replace(/\n/g, "<br/>")}</div>\n${pixelTag}`;
  }

  let mimeBody: string;
  if (finalHtml) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    mimeBody = [
      headers.join("\r\n"),
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      options.bodyText,
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      finalHtml,
      "",
      `--${boundary}--`,
    ].join("\r\n");
  } else {
    headers.push('Content-Type: text/plain; charset="UTF-8"');
    headers.push("Content-Transfer-Encoding: 8bit");
    mimeBody = [headers.join("\r\n"), "", options.bodyText].join("\r\n");
  }

  return { raw: base64UrlEncode(mimeBody), rfcMessageId: messageId };
}
