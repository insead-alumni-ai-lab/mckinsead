/**
 * PPTX Renderer — M1 PPTX export using pptxgenjs.
 *
 * Takes the same DeckSchema structure as the HTML renderer
 * and produces a downloadable .pptx file.
 */

export interface PptxSlide {
  action_title: string;
  body_type: "bullets" | "chart" | "table" | "kpi" | "quote";
  body_content: string;
  footer_sources: string[];
}

export interface PptxDeckConfig {
  title: string;
  subtitle?: string;
  slides: PptxSlide[];
  theme?: "navy" | "minimal" | "dark";
  slideSize?: "16:9" | "4:3";
  includeAppendix?: boolean;
  includePageNumbers?: boolean;
}

/**
 * Generate PPTX buffer from deck config.
 * Returns a Buffer (Node) or Blob (browser) depending on environment.
 */
export async function renderPptx(config: PptxDeckConfig): Promise<Buffer | Blob> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  pptx.layout = config.slideSize === "4:3" ? "LAYOUT_4x3" : "LAYOUT_WIDE";
  pptx.title = config.title;
  pptx.author = "mckinsead";

  const themes = {
    navy: { bg: "1e293b", accent: "2563eb", slideBg: "ffffff", text: "1e293b", muted: "94a3b8" },
    minimal: { bg: "111827", accent: "6366f1", slideBg: "ffffff", text: "111827", muted: "9ca3af" },
    dark: { bg: "0f172a", accent: "60a5fa", slideBg: "1e293b", text: "f8fafc", muted: "64748b" },
  };
  const t = themes[config.theme ?? "navy"];

  // ─── Title slide ─────────────────────────────────────────────────
  const title = pptx.addSlide();
  title.background = { color: t.bg };
  title.addText(config.title, {
    x: 0.8, y: 1.5, w: "85%", h: 1.5,
    fontSize: 36, color: "ffffff", fontFace: "Arial", bold: true,
  });
  if (config.subtitle) {
    title.addText(config.subtitle, {
      x: 0.8, y: 3.2, w: "85%", h: 0.6,
      fontSize: 18, color: t.muted, fontFace: "Arial",
    });
  }
  title.addText("Prepared with mckinsead", {
    x: 0.8, y: 4.8, w: "85%", h: 0.4,
    fontSize: 10, color: t.muted, fontFace: "Arial",
  });

  // ─── Content slides ──────────────────────────────────────────────
  config.slides.forEach((slide, idx) => {
    const s = pptx.addSlide();
    s.background = { color: t.slideBg };

    // Action title
    s.addText(slide.action_title, {
      x: 0.6, y: 0.3, w: "88%", h: 0.8,
      fontSize: 20, color: t.text, fontFace: "Arial", bold: true,
    });

    // Accent bar under title
    s.addShape(pptx.ShapeType.rect, {
      x: 0.6, y: 1.05, w: 1.5, h: 0.04,
      fill: { color: t.accent },
    });

    // Body
    const bodyOpts = {
      x: 0.6, y: 1.4, w: "88%", h: 3.5,
      fontSize: 13, color: t.text, fontFace: "Arial",
      valign: "top" as const,
    };

    if (slide.body_type === "bullets") {
      const bullets = slide.body_content.split("\n").filter(Boolean);
      s.addText(
        bullets.map((b) => ({
          text: b.replace(/^[-•]\s*/, ""),
          options: { bullet: true, fontSize: 13, color: t.text },
        })),
        bodyOpts
      );
    } else {
      s.addText(slide.body_content, bodyOpts);
    }

    // Footer sources
    if (slide.footer_sources.length > 0) {
      s.addText(`Source: ${slide.footer_sources.join(" · ")}`, {
        x: 0.6, y: 5.0, w: "88%", h: 0.3,
        fontSize: 8, color: t.muted, fontFace: "Arial",
      });
    }

    // Page number
    if (config.includePageNumbers !== false) {
      s.addText(`${idx + 2}`, {
        x: 9.2, y: 5.0, w: 0.5, h: 0.3,
        fontSize: 8, color: t.muted, fontFace: "Arial", align: "right",
      });
    }
  });

  return pptx.write({ outputType: "nodebuffer" }) as Promise<Buffer>;
}
