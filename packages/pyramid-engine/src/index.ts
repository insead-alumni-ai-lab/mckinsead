/**
 * Pyramid Engine — Validates and structures Pyramid Principle narratives.
 *
 * §7.10: Governing thought → 3-5 key lines (MECE) → supporting evidence.
 * §2: "Pyramid before slides" — never render slides without a validated pyramid.
 */

import { z } from "zod";

// Pyramid structure
export const PyramidNodeSchema: z.ZodType<PyramidNode> = z.lazy(() =>
  z.object({
    statement: z.string().min(1),
    type: z.enum(["governing_thought", "key_line", "evidence"]),
    children: z.array(PyramidNodeSchema),
    evidence_ids: z.array(z.string()).optional(),
  })
);

export interface PyramidNode {
  statement: string;
  type: "governing_thought" | "key_line" | "evidence";
  children: PyramidNode[];
  evidence_ids?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a pyramid structure.
 */
export function validatePyramid(root: PyramidNode): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Root must be governing_thought
  if (root.type !== "governing_thought") {
    errors.push("Root node must be a governing_thought");
  }

  // 2. Key lines: 3-5 recommended
  const keyLines = root.children;
  if (keyLines.length < 2) {
    errors.push(`Need at least 2 key lines, found ${keyLines.length}`);
  }
  if (keyLines.length > 5) {
    warnings.push(`More than 5 key lines (${keyLines.length}) — consider consolidating`);
  }

  // 3. Each key line must have children (evidence)
  for (const kl of keyLines) {
    if (kl.type !== "key_line") {
      errors.push(`Direct children of governing thought must be key_lines, found: "${kl.statement}"`);
    }
    if (kl.children.length === 0) {
      warnings.push(`Key line "${kl.statement}" has no supporting evidence`);
    }
  }

  // 4. MECE check (basic — flag obvious overlaps)
  const statements = keyLines.map((kl) => kl.statement.toLowerCase());
  for (let i = 0; i < statements.length; i++) {
    for (let j = i + 1; j < statements.length; j++) {
      // Simple overlap heuristic: >50% word overlap
      const words1 = new Set(statements[i].split(/\s+/));
      const words2 = new Set(statements[j].split(/\s+/));
      const overlap = [...words1].filter((w) => words2.has(w)).length;
      const minSize = Math.min(words1.size, words2.size);
      if (minSize > 3 && overlap / minSize > 0.5) {
        warnings.push(
          `Potential overlap between key lines ${i + 1} and ${j + 1}: "${keyLines[i].statement}" / "${keyLines[j].statement}"`
        );
      }
    }
  }

  // 5. Every leaf should have evidence
  function checkLeaves(node: PyramidNode, path: string) {
    if (node.children.length === 0) {
      if (!node.evidence_ids || node.evidence_ids.length === 0) {
        warnings.push(`Leaf "${path}" has no linked evidence`);
      }
    }
    node.children.forEach((child, i) => checkLeaves(child, `${path}.${i + 1}`));
  }
  keyLines.forEach((kl, i) => checkLeaves(kl, `KL${i + 1}`));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Flatten pyramid into a slide outline.
 * Each key line becomes a section header, each evidence node a slide.
 */
export function pyramidToSlideOutline(root: PyramidNode): Array<{
  section: string;
  slides: Array<{ title: string; evidence_ids: string[] }>;
}> {
  return root.children.map((kl) => ({
    section: kl.statement,
    slides: kl.children.map((evidence) => ({
      title: evidence.statement,
      evidence_ids: evidence.evidence_ids ?? [],
    })),
  }));
}
