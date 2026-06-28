/**
 * WhatsApp notifications via Meta WhatsApp Cloud API.
 *
 * Required env vars (set in Railway / .env):
 *   META_WHATSAPP_TOKEN    – Permanent access token from Meta Business Manager
 *   META_WHATSAPP_PHONE_ID – Phone Number ID from the WhatsApp app in Meta dashboard
 *
 * Admin alerts go to ADMIN_WHATSAPP (env var) or fall back to the site phone from SiteSettings.
 * Customer messages are only sent when the customer provided a phone number at checkout.
 *
 * Both functions are fire-and-forget and no-op silently if env vars are absent.
 *
 * Note: Business-initiated messages outside a 24h customer-reply window require
 * pre-approved Meta message templates. For instant booking alerts the simplest
 * approach is to register one template for each message type in Meta Business Manager
 * and reference it here. During development / sandbox testing, free-form text works
 * for registered test phone numbers.
 */

const GRAPH_VERSION = "v21.0";

function getConfig() {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return null;
  return { token, phoneId };
}

/** Normalise any phone string to E.164 digits only (no + or spaces). */
function toE164Digits(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

async function sendMessage(to: string, body: string): Promise<void> {
  const cfg = getConfig();
  if (!cfg) {
    console.log(`[whatsapp] META_WHATSAPP_TOKEN or META_WHATSAPP_PHONE_ID not set — skipping message to ${to}`);
    return;
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${cfg.phoneId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toE164Digits(to),
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Meta WhatsApp API error ${res.status}: ${err}`);
  }
}

export async function sendAdminWhatsApp(args: {
  adminPhone: string;
  reference: string;
  tourTitle: string;
  startsAt: string;
  customerName: string;
  customerEmail: string;
  seats: number;
  totalNZD: string;
}): Promise<void> {
  const body =
    `🎉 New booking: ${args.reference}\n` +
    `Tour: ${args.tourTitle}\n` +
    `Date: ${args.startsAt}\n` +
    `Guests: ${args.seats} — ${args.totalNZD}\n` +
    `Customer: ${args.customerName} (${args.customerEmail})`;

  try {
    await sendMessage(args.adminPhone, body);
  } catch (e) {
    console.error("[whatsapp] admin alert failed:", e);
  }
}

export async function sendCustomerWhatsApp(args: {
  phone: string;
  firstName: string;
  reference: string;
  tourTitle: string;
  startsAt: string;
  siteName: string;
  sitePhone: string;
}): Promise<void> {
  const body =
    `Hi ${args.firstName}! Your booking is confirmed 🎊\n\n` +
    `📌 ${args.tourTitle}\n` +
    `📅 ${args.startsAt}\n` +
    `🔖 Reference: ${args.reference}\n\n` +
    `A confirmation email is also on its way. Questions? Call us: ${args.sitePhone}\n` +
    `— ${args.siteName}`;

  try {
    await sendMessage(args.phone, body);
  } catch (e) {
    console.error("[whatsapp] customer message failed:", e);
  }
}
