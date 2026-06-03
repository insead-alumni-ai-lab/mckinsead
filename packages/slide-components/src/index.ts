/**
 * Slide Components — HTML slide rendering primitives.
 *
 * Generates consulting-grade HTML slides following the slide grammar:
 * - Action title (≤14 words, full sentence, so-what)
 * - Body: chart | table | bullets | kpi | quote
 * - Footer: source citations
 *
 * §7.10 + slide-grammar SKILL
 */

export interface SlideProps {
  title: string; // Action title — the so-what
  type: "kpi" | "bullets" | "table" | "chart" | "quote";
  body: string; // HTML body content
  sources: string[]; // Footer citations
}

/**
 * Render a single slide to HTML.
 */
export function renderSlideHTML(slide: SlideProps): string {
  return `
<section class="slide" style="
  width: 960px; height: 540px; position: relative; overflow: hidden;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;
  padding: 40px 48px; box-sizing: border-box;
  page-break-after: always;
">
  <!-- Action Title -->
  <h2 style="
    font-size: 22px; font-weight: 600; color: #102a43;
    margin: 0 0 24px 0; line-height: 1.3;
    border-bottom: 3px solid #0967d2; padding-bottom: 12px;
  ">${escapeHtml(slide.title)}</h2>

  <!-- Body -->
  <div style="flex: 1; font-size: 16px; color: #334e68; line-height: 1.6;">
    ${slide.body}
  </div>

  <!-- Footer Sources -->
  <div style="
    position: absolute; bottom: 16px; left: 48px; right: 48px;
    font-size: 10px; color: #829ab1; border-top: 1px solid #e5e7eb;
    padding-top: 8px;
  ">
    ${slide.sources.map((s) => `<span>${escapeHtml(s)}</span>`).join(" · ")}
  </div>
</section>`.trim();
}

/**
 * Render a full deck to HTML.
 */
export function renderDeckHTML(slides: SlideProps[], meta: { title: string; company: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.title)} — ${escapeHtml(meta.company)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f3f4f6; padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 40px; }
    .slide { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    @media print { body { padding: 0; gap: 0; background: white; } .slide { box-shadow: none; border: none; } }
  </style>
</head>
<body>
  ${slides.map((s) => renderSlideHTML(s)).join("\n  ")}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
