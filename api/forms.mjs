// Website forms → email to Uppertunity Health.
// Handles: "Submit your CV", "Talk to a recruiter", "Fill a role" and the footer "Job alerts" signup.
// Sends one email per submission through Resend (account in the client's name).
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY  key from the client's Resend account
//   FORMS_TO        where submissions go, e.g. info@uppertunity.health
//   FORMS_FROM      sender on the verified domain, e.g. "Uppertunity Health Website <website@uppertunity.health>"
// Until RESEND_API_KEY is set (test site), submissions are accepted but not emailed.

const FORMS = {
  'Submit your CV': 'New CV submitted',
  'Talk to a recruiter': 'New request to talk to a recruiter',
  'Fill a role': 'New request to fill a role',
  'Job alerts': 'New job alerts signup',
};

const LABELS = {
  first_name: 'First name', last_name: 'Last name', name: 'Name', title: 'Job title',
  organization: 'Organization / practice', email: 'Email', phone: 'Phone', profession: 'Profession',
  location: 'Current location', stage: 'Where they are in their search', best_time: 'Best time to reach',
  contact_pref: 'Preferred contact', role: 'Role', role_location: 'Location of the role',
  employment_type: 'Employment type', message: 'Message', consent: 'Agreed to be contacted',
};

const MAX_FILE = 4 * 1024 * 1024;
const OK_TYPES = /\.(pdf|doc|docx)$/i;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export async function POST(request) {
  let data;
  try { data = await request.formData(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }

  const formName = String(data.get('form') || '');
  if (!FORMS[formName]) return json({ ok: false, error: 'unknown_form' }, 400);
  if (data.get('company_website')) return json({ ok: true }); // hidden spam trap was filled in: quietly ignore

  const email = String(data.get('email') || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'email' }, 400);

  const rows = [], attachments = [];
  for (const [key, value] of data.entries()) {
    if (key === 'form' || key === 'company_website') continue;
    if (typeof value === 'object' && value && 'arrayBuffer' in value) {
      if (!value.size) continue;
      if (value.size > MAX_FILE || !OK_TYPES.test(value.name)) return json({ ok: false, error: 'file' }, 400);
      attachments.push({ filename: value.name, content: Buffer.from(await value.arrayBuffer()).toString('base64') });
      continue;
    }
    const text = String(value).trim();
    if (!text) continue;
    rows.push([LABELS[key] || key.replace(/_/g, ' '), key === 'consent' ? 'Yes' : text.slice(0, 5000)]);
  }

  const who = String(data.get('name') || [data.get('first_name'), data.get('last_name')].filter(Boolean).join(' ') || data.get('organization') || email).trim();
  const subject = FORMS[formName] + (who ? ' – ' + who : '');
  const html = '<h2 style="font-family:Arial,sans-serif;color:#2d2f47">' + esc(FORMS[formName]) + '</h2>' +
    '<table style="font-family:Arial,sans-serif;font-size:15px;border-collapse:collapse">' +
    rows.map(([k, v]) => '<tr><td style="padding:6px 16px 6px 0;color:#5b5e74;vertical-align:top;white-space:nowrap">' + esc(k) +
      '</td><td style="padding:6px 0;color:#2d2f47;white-space:pre-wrap">' + esc(v) + '</td></tr>').join('') +
    '</table>' + (attachments.length ? '<p style="font-family:Arial,sans-serif;color:#5b5e74">Attached: ' + attachments.map(a => esc(a.filename)).join(', ') + '</p>' : '') +
    '<p style="font-family:Arial,sans-serif;font-size:12px;color:#8a8ca0">Sent from the form on uppertunity.health. Reply to this email to answer them directly.</p>';

  const key = process.env.RESEND_API_KEY;
  if (!key) { console.warn('RESEND_API_KEY not set: form accepted but not emailed (test site).'); return json({ ok: true, test: true }); }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.FORMS_FROM || 'Uppertunity Health Website <website@uppertunity.health>',
      to: (process.env.FORMS_TO || 'info@uppertunity.health').split(',').map(s => s.trim()),
      reply_to: email,
      subject,
      html,
      attachments: attachments.length ? attachments : undefined,
    }),
  });
  if (!res.ok) { console.error('Resend error', res.status, await res.text()); return json({ ok: false, error: 'send' }, 502); }
  return json({ ok: true });
}
