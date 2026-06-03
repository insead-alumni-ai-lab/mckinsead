/**
 * MECE Linter — Validates Mutually Exclusive, Collectively Exhaustive breakdowns.
 *
 * §2: "MECE everywhere" — one of the six non-negotiable principles.
 * Used on hypothesis trees, pyramid key lines, framework categories, etc.
 */

export interface MECEInput {
  items: string[];
  context?: string; // What these items are breaking down
  level?: string; // e.g., "hypothesis tree level 2"
}

export interface MECEResult {
  pass: boolean;
  score: number; // 0-1
  issues: Array<{
    type: "overlap" | "gap" | "abstraction_mismatch" | "too_few" | "too_many";
    severity: "blocking" | "advisory";
    message: string;
  }>;
}

/**
 * Run heuristic MECE check.
 *
 * This is the fast, rule-based version. For deeper analysis,
 * use the LLM-assisted check (calls the Critique Agent).
 */
export function checkMECE(input: MECEInput): MECEResult {
  const issues: MECEResult["issues"] = [];

  // 1. Minimum items
  if (input.items.length < 2) {
    issues.push({
      type: "too_few",
      severity: "blocking",
      message: `Only ${input.items.length} item(s) — a breakdown needs at least 2 mutually exclusive items`,
    });
  }

  // 2. Maximum items (cognitive overload)
  if (input.items.length > 7) {
    issues.push({
      type: "too_many",
      severity: "advisory",
      message: `${input.items.length} items may be too many — consider grouping into 3-5 categories`,
    });
  }

  // 3. Overlap detection (word similarity heuristic)
  for (let i = 0; i < input.items.length; i++) {
    for (let j = i + 1; j < input.items.length; j++) {
      const sim = jaccardSimilarity(input.items[i], input.items[j]);
      if (sim > 0.4) {
        issues.push({
          type: "overlap",
          severity: "blocking",
          message: `Potential overlap between "${input.items[i]}" and "${input.items[j]}" (similarity: ${(sim * 100).toFixed(0)}%)`,
        });
      }
    }
  }

  // 4. Abstraction level check (length heuristic — very different lengths suggest different abstraction levels)
  const lengths = input.items.map((item) => item.split(/\s+/).length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  for (let i = 0; i < input.items.length; i++) {
    if (lengths[i] > avgLen * 2.5 || lengths[i] < avgLen * 0.3) {
      issues.push({
        type: "abstraction_mismatch",
        severity: "advisory",
        message: `"${input.items[i]}" seems at a different level of abstraction than the others`,
      });
    }
  }

  // Score
  const blockingCount = issues.filter((i) => i.severity === "blocking").length;
  const advisoryCount = issues.filter((i) => i.severity === "advisory").length;
  const score = Math.max(0, 1 - blockingCount * 0.3 - advisoryCount * 0.1);

  return {
    pass: blockingCount === 0,
    score,
    issues,
  };
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}
