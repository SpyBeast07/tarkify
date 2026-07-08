import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { renderAllPreviews, renderPreviewDashboard } from '../src/email/preview.js';

const outDir = join(import.meta.dirname, '..', 'email-previews');
mkdirSync(outDir, { recursive: true });

const items = renderAllPreviews();

for (const item of items) {
  const filePath = join(outDir, `${item.filename}.html`);
  writeFileSync(
    filePath,
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${item.name}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
${item.html}
</body>
</html>`,
  );
  console.log(`✓ ${item.filename}.html`);
}

const dashboardPath = join(outDir, 'index.html');
writeFileSync(dashboardPath, renderPreviewDashboard());
console.log(`\n✓ index.html (dashboard)`);
console.log(`\nExported ${items.length} templates to ${outDir}`);
