import { z } from "zod";
import { router, publicProcedure } from "../lib/trpc";
import { prisma } from "../lib/prisma";
import { DeckSchema, PyramidSchema } from "@mckinsead/schemas";

/**
 * Deck & Pyramid router — M0: plain HTML slide export.
 * Per §7.11-12: Pyramid before slides. Every slide has action title + so-what.
 */
export const deckRouter = router({
  /** Save the pyramid structure */
  savePyramid: publicProcedure
    .input(
      z.object({
        engagementId: z.string().uuid(),
        pyramid: PyramidSchema,
      })
    )
    .mutation(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });

      const data = engagement.data as Record<string, unknown>;
      data.pyramid = input.pyramid;
      data.version = engagement.version + 1;
      data.updated_at = new Date().toISOString();

      await prisma.engagement.update({
        where: { id: input.engagementId },
        data: { data, version: engagement.version + 1 },
      });

      await prisma.auditEntry.create({
        data: {
          engagementId: input.engagementId,
          agent: "synthesis",
          action: "pyramid_saved",
        },
      });

      return { success: true };
    }),

  /** Save the deck (slides) */
  saveDeck: publicProcedure
    .input(
      z.object({
        engagementId: z.string().uuid(),
        deck: DeckSchema,
      })
    )
    .mutation(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });

      const data = engagement.data as Record<string, unknown>;
      data.deck = input.deck;
      data.version = engagement.version + 1;
      data.updated_at = new Date().toISOString();

      await prisma.engagement.update({
        where: { id: input.engagementId },
        data: { data, version: engagement.version + 1 },
      });

      await prisma.auditEntry.create({
        data: {
          engagementId: input.engagementId,
          agent: "communication",
          action: "deck_saved",
          diff: JSON.stringify({ slide_count: input.deck.slides.length }),
        },
      });

      return { success: true };
    }),

  /** Export deck as HTML */
  exportHtml: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });

      const data = engagement.data as Record<string, unknown>;
      const deck = data.deck as { slides: Array<Record<string, unknown>> } | undefined;

      if (!deck?.slides?.length) {
        throw new Error("No slides to export. Build the deck first.");
      }

      // Generate plain HTML deck (M0)
      const html = generateHtmlDeck(
        deck.slides,
        (data.company_profile as Record<string, unknown>)?.name as string ?? "Strategy Deck"
      );

      return { html };
    }),
});

/**
 * M0 HTML deck generator — plain HTML with consulting-style formatting.
 * §7.12: Action title, one message per slide, footer sources.
 */
function generateHtmlDeck(
  slides: Array<Record<string, unknown>>,
  title: string
): string {
  const slideHtml = slides
    .map(
      (slide, i) => `
    <section class="slide" id="slide-${i + 1}">
      <h2 class="action-title">${slide.action_title ?? `Slide ${i + 1}`}</h2>
      <div class="slide-body">
        ${renderSlideBody(slide)}
      </div>
      ${
        Array.isArray(slide.footer_sources) && slide.footer_sources.length
          ? `<footer class="sources">Source: ${(slide.footer_sources as string[]).join("; ")}</footer>`
          : ""
      }
    </section>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; color: #1a1a1a; }
    .deck-header { background: #003366; color: white; padding: 60px 80px; }
    .deck-header h1 { font-size: 2.5rem; font-weight: 300; }
    .deck-header .subtitle { font-size: 1.1rem; opacity: 0.8; margin-top: 8px; }
    .slide { background: white; margin: 24px auto; max-width: 960px; padding: 48px 64px;
             border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); min-height: 540px;
             display: flex; flex-direction: column; page-break-after: always; }
    .action-title { font-size: 1.4rem; font-weight: 600; color: #003366; border-bottom: 2px solid #0066cc;
                    padding-bottom: 12px; margin-bottom: 24px; }
    .slide-body { flex: 1; font-size: 1rem; line-height: 1.6; }
    .slide-body ul { margin-left: 24px; }
    .slide-body li { margin-bottom: 8px; }
    .sources { font-size: 0.75rem; color: #666; border-top: 1px solid #eee; padding-top: 8px; margin-top: 24px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .kpi-card { background: #f0f4f8; border-radius: 8px; padding: 20px; text-align: center; }
    .kpi-value { font-size: 2rem; font-weight: 700; color: #003366; }
    .kpi-label { font-size: 0.85rem; color: #666; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #003366; color: white; padding: 10px 16px; text-align: left; font-weight: 500; }
    td { padding: 10px 16px; border-bottom: 1px solid #eee; }
    tr:hover td { background: #f8f9fa; }
    nav.slide-nav { position: fixed; bottom: 24px; right: 24px; display: flex; gap: 8px; }
    nav.slide-nav button { padding: 8px 16px; border: 1px solid #003366; background: white;
                           color: #003366; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
    nav.slide-nav button:hover { background: #003366; color: white; }
    @media print { .slide { box-shadow: none; margin: 0; } nav.slide-nav { display: none; } }
  </style>
</head>
<body>
  <header class="deck-header">
    <h1>${title}</h1>
    <p class="subtitle">Strategy Analysis · ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
  </header>
  ${slideHtml}
  <nav class="slide-nav">
    <button onclick="navigate(-1)">← Prev</button>
    <button onclick="navigate(1)">Next →</button>
  </nav>
  <script>
    const slides = document.querySelectorAll('.slide');
    let current = 0;
    function navigate(dir) {
      current = Math.max(0, Math.min(slides.length - 1, current + dir));
      slides[current].scrollIntoView({ behavior: 'smooth' });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate(1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') navigate(-1);
    });
  </script>
</body>
</html>`;
}

function renderSlideBody(slide: Record<string, unknown>): string {
  const bodyType = slide.body_type as string;
  const content = slide.body_content as Record<string, unknown> | undefined;

  if (!content) return "<p>No content</p>";

  switch (bodyType) {
    case "bullets":
      const items = (content.items as string[]) ?? [];
      return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;

    case "kpi":
      const kpis = (content.kpis as Array<{ label: string; value: string }>) ?? [];
      return `<div class="kpi-grid">${kpis
        .map(
          (kpi) =>
            `<div class="kpi-card"><div class="kpi-value">${kpi.value}</div><div class="kpi-label">${kpi.label}</div></div>`
        )
        .join("")}</div>`;

    case "table":
      const headers = (content.headers as string[]) ?? [];
      const rows = (content.rows as string[][]) ?? [];
      return `<table>
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>`;

    case "quote":
      return `<blockquote style="border-left: 4px solid #0066cc; padding-left: 16px; font-style: italic;">
        "${content.text}"
        <cite style="display: block; margin-top: 8px; font-size: 0.85rem; color: #666;">— ${content.author ?? "Unknown"}</cite>
      </blockquote>`;

    case "chart":
      return `<div class="chart-placeholder" style="background: #f0f4f8; padding: 40px; text-align: center; border-radius: 8px;">
        <p style="color: #666;">[Chart: ${content.chart_type ?? "visualization"}]</p>
        <p style="font-size: 0.85rem; color: #999;">Chart rendering available in M1</p>
      </div>`;

    default:
      return `<p>${JSON.stringify(content)}</p>`;
  }
}
