# Uppertunity Health – website

Built by Art&Soul. Plain HTML/CSS/JS, no framework and no build step.
Hosted on Vercel: every change pushed to `main` goes live automatically.

## Files
| File | What it is |
|---|---|
| `index.html` | The homepage: layout, styles, animations and forms |
| `images/` | Photos and artwork |
| `vercel.json` | Vercel settings (kept here, not in the Vercel dashboard, so a re-import reproduces everything) |
| `.env.example` | Names of the secret keys the site needs on Vercel (values are never stored here) |

## Status
- **Preview stage.** The site is hidden from Google (`noindex` in `index.html` and `vercel.json`). Remove both at launch.
- **Fonts:** Adobe Fonts web project (Typekit kit in `index.html`). Add each domain the site runs on (preview .vercel.app and the live domain) to the web project. At launch the kit must come from the client's own Creative Cloud subscription.
- **Forms:** check fields and show the thank-you popup; not sending yet (`FORM_ENDPOINT = null` in `index.html`). At launch: a Vercel function at `/api/forms` that emails info@uppertunity.health with attachments.

## Handover checklist
1. Client's Vercel **Pro** account → Add New → Project → Import this repository → Deploy.
2. Re-enter the keys listed in `.env.example`.
3. Connect the domain (registered in the client's name).
4. Remove `noindex`, test the forms, then delete the preview project from Art&Soul's Vercel account.
5. **Switch this GitHub repository back to Private** (Settings → General → Danger Zone → Change repository visibility). It is public only so the free Vercel plan can show previews.
