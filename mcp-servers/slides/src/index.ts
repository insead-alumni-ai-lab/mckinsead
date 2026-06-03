/**
 * MCP Server: PPTX Slide Export
 *
 * Generates PowerPoint files from the deck structure using pptxgenjs.
 * Consulting-style slide grammar: action title + body + footer sources.
 *
 * Tools:
 * - generate_pptx: Build a PPTX from slide array
 * - add_chart_slide: Add a chart slide (bar, line, pie, scatter)
 * - add_kpi_slide: Add a KPI/metric callout slide
 */

import { z } from "zod";

const SlideSchema = z.object({
  action_title: z.string().describe("≤14 word action title (the so-what)"),
  body_type: z.enum(["bullets", "chart", "table", "kpi", "quote"]),
  body_content: z.string().describe("Body content or JSON for chart data"),
  footer_sources: z.array(z.string()).default([]),
});

export const tools = {
  generate_pptx: {
    name: "generate_pptx",
    description: "Generate a PPTX file from an array of slide definitions",
    inputSchema: z.object({
      engagement_id: z.string().uuid(),
      title: z.string(),
      subtitle: z.string().optional(),
      slides: z.array(SlideSchema),
      theme: z.enum(["navy", "minimal", "dark"]).default("navy"),
      slide_size: z.enum(["16:9", "4:3"]).default("16:9"),
      include_appendix: z.boolean().default(true),
    }),
  },
  add_chart_slide: {
    name: "add_chart_slide",
    description: "Create a chart slide (bar, line, pie, scatter) from data",
    inputSchema: z.object({
      chart_type: z.enum(["bar", "line", "pie", "scatter", "waterfall"]),
      title: z.string(),
      data: z.object({
        labels: z.array(z.string()),
        datasets: z.array(z.object({
          name: z.string(),
          values: z.array(z.number()),
        })),
      }),
      action_title: z.string(),
      sources: z.array(z.string()).default([]),
    }),
  },
  add_kpi_slide: {
    name: "add_kpi_slide",
    description: "Create a KPI callout slide with large metric + context",
    inputSchema: z.object({
      action_title: z.string(),
      metrics: z.array(z.object({
        label: z.string(),
        value: z.string(),
        delta: z.string().optional(),
        delta_direction: z.enum(["up", "down", "neutral"]).optional(),
      })),
      sources: z.array(z.string()).default([]),
    }),
  },
};

// PPTX generation using pptxgenjs
export async function handleGeneratePptx(input: {
  engagement_id: string;
  title: string;
  subtitle?: string;
  slides: Array<{
    action_title: string;
    body_type: string;
    body_content: string;
    footer_sources: string[];
  }>;
  theme?: string;
  slide_size?: string;
}) {
  // Dynamic import for pptxgenjs
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  pptx.layout = input.slide_size === "4:3" ? "LAYOUT_4x3" : "LAYOUT_WIDE";
  pptx.title = input.title;

  // Theme colors
  const theme = input.theme ?? "navy";
  const colors: Record<string, { primary: string; accent: string; bg: string; text: string }> = {
    navy: { primary: "1e293b", accent: "2563eb", bg: "ffffff", text: "1e293b" },
    minimal: { primary: "111827", accent: "6366f1", bg: "ffffff", text: "111827" },
    dark: { primary: "f8fafc", accent: "60a5fa", bg: "0f172a", text: "f8fafc" },
  };
  const c = colors[theme] ?? colors.navy;

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: c.primary };
  titleSlide.addText(input.title, {
    x: 0.8, y: 1.5, w: "80%", h: 1.5,
    fontSize: 36, color: "ffffff", fontFace: "Arial",
    bold: true,
  });
  if (input.subtitle) {
    titleSlide.addText(input.subtitle, {
      x: 0.8, y: 3.2, w: "80%", h: 0.8,
      fontSize: 18, color: "94a3b8", fontFace: "Arial",
    });
  }

  // Content slides
  for (const slide of input.slides) {
    const s = pptx.addSlide();
    s.background = { color: c.bg };

    // Action title with accent underline
    s.addText(slide.action_title, {
      x: 0.6, y: 0.3, w: "90%", h: 0.8,
      fontSize: 20, color: c.text, fontFace: "Arial",
      bold: true,
    });
    s.addShape(pptx.ShapeType.rect, {
      x: 0.6, y: 1.05, w: 1.5, h: 0.04,
      fill: { color: c.accent },
    });

    // Body content
    s.addText(slide.body_content, {
      x: 0.6, y: 1.4, w: "90%", h: 3.5,
      fontSize: 14, color: c.text, fontFace: "Arial",
      valign: "top",
    });

    // Footer sources
    if (slide.footer_sources.length > 0) {
      s.addText(`Source: ${slide.footer_sources.join(" · ")}`, {
        x: 0.6, y: 5.0, w: "90%", h: 0.4,
        fontSize: 8, color: "94a3b8", fontFace: "Arial",
      });
    }
  }

  // Generate buffer
  const buffer = await pptx.write({ outputType: "nodebuffer" });
  return {
    status: "success",
    slide_count: input.slides.length + 1,
    size_bytes: (buffer as Buffer).length,
    message: "PPTX generated successfully",
  };
}

console.log("📊 MCP Slides (PPTX) server ready (M1 — pptxgenjs)");
