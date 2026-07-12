import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const previewDir = join(import.meta.dirname, '..', 'email-previews');
const files = readdirSync(previewDir).filter((f) => f.endsWith('.html') && f !== 'index.html');

let passed = 0;
let failed = 0;
let warnings = 0;

interface Check {
  name: string;
  pass: boolean;
  detail?: string;
}

function check(checks: Check[], condition: boolean, name: string, detail?: string) {
  checks.push({ name, pass: condition, detail });
}

function report(file: string, checks: Check[]) {
  const filePass = checks.every((c) => c.pass);
  if (filePass) passed++;
  else failed++;

  if (!filePass) {
    console.log(`\n\x1b[31m✗ ${file}\x1b[0m`);
    for (const c of checks) {
      if (!c.pass) console.log(`    ${c.name} — ${c.detail ?? 'FAILED'}`);
    }
  } else {
    console.log(`\n\x1b[32m✓ ${file}\x1b[0m`);
    for (const c of checks) {
      if (!c.pass) console.log(`    ${c.name} — ${c.detail ?? 'FAILED'}`);
    }
  }
}

for (const file of files) {
  const html = readFileSync(join(previewDir, file), 'utf-8');
  const checks: Check[] = [];

  // ── Accessibility Checks ──────────────────────────────────────
  check(checks, html.includes('<html lang="en"'), 'html[lang="en"]', 'Missing lang attribute');
  check(checks, html.includes('<!DOCTYPE html>'), '<!DOCTYPE html>', 'Missing DOCTYPE');
  check(checks, html.includes('role="presentation"'), 'Tables have role="presentation"', 'Layout tables missing role="presentation"');

  // Headings
  const h1Count = (html.match(/<h1\b/g) || []).length;
  check(checks, h1Count <= 1, `At most one <h1> (found ${h1Count})`, h1Count > 1 ? 'Multiple h1 elements' : undefined);

  // Links
  const linkMatches = html.match(/<a\s[^>]*>/g) || [];
  for (const link of linkMatches) {
    // Check for href
    check(checks, /href=(["'])/.test(link), 'All <a> have href', `Missing href in: ${link.substring(0, 60)}`);
    if (link.includes('href="mailto:support@tarkify.qzz.io')) {
      // mailto links are fine without target
    } else if (link.includes('href="')) {
      check(checks, /target="_blank"/.test(link), 'External <a> has target="_blank"', `Missing target in: ${link.substring(0, 60)}`);
    }
    // Check link text is not empty
    const linkContent = html.substring(
      html.indexOf(link) + link.length,
      Math.min(html.indexOf('</a>', html.indexOf(link)), html.indexOf('</a>', html.indexOf(link)) + 4),
    );
    // Basic check: link text is present
    check(checks, linkContent.trim().length > 0, 'Links have text content', `Empty link: ${link.substring(0, 60)}`);
  }

  // ── Dark Mode Checks ─────────────────────────────────────────
  check(checks, html.includes('prefers-color-scheme'), 'Dark mode media query present', 'Missing @media (prefers-color-scheme: dark)');
  check(checks, /background[^;]*#[a-fA-F0-9]{6}/.test(html), 'Explicit background colors on body', 'Missing explicit body background');
  check(checks, /color[^;]*#[a-fA-F0-9]{6}/.test(html), 'Explicit text colors', 'Missing explicit text colors');

  // ── Image Checks ─────────────────────────────────────────────
  const imgMatches = html.match(/<img\s[^>]*>/g) || [];
  for (const img of imgMatches) {
    check(checks, /\salt=(["'])/.test(img), 'All <img> have alt text', `Missing alt in: ${img.substring(0, 60)}`);
  }
  check(checks, imgMatches.length === 0, 'No images used (all text-based)', 'Images without alt text found');

  // ── URL/Link Verification ────────────────────────────────────
  const allUrls: string[] = [];
  const urlRegex = /href="([^"]+)"/g;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(html)) !== null) {
    allUrls.push(urlMatch[1]);
  }

  for (const url of allUrls) {
    if (!url.startsWith('http') && !url.startsWith('mailto') && !url.startsWith('#') && !url.startsWith('javascript:')) {
      check(checks, false, 'URLs use absolute paths', `Relative URL: ${url}`);
    }
    // Verify mailto has proper format
    if (url.startsWith('mailto:')) {
      const email = url.replace('mailto:', '');
      check(checks, email.includes('@'), 'mailto: URLs valid', `Invalid mailto: ${url}`);
    }
  }

  // ── Accessibility extras ──────────────────────────────────────
  check(checks, html.includes('<meta charset="UTF-8"'), 'Meta charset UTF-8', 'Missing charset meta');
  check(checks, html.includes('<meta name="viewport"'), 'Viewport meta tag', 'Missing viewport meta');

  // ── Email Client Compatibility ────────────────────────────────
  check(checks, html.includes('<!--[if mso]'), 'MSO conditional comments', 'Missing Outlook conditional comments');
  check(checks, html.includes('max-width:600px') || html.includes('width="600"'), 'Max-width 600px constraint', 'Missing width constraint');
  check(checks, html.includes('email-container'), 'Responsive class .email-container', 'Missing responsive class');

  report(file, checks);
}

console.log(`\n\x1b[1m─── Summary ───\x1b[0m`);
console.log(`Total: ${files.length}`);
console.log(`Pass:  \x1b[32m${passed}\x1b[0m`);
console.log(`Fail:  \x1b[31m${failed}\x1b[0m`);
