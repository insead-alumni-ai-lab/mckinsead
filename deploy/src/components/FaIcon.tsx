/**
 * Font Awesome icon wrapper.
 * Uses the CDN-loaded FA 6.x classes via <i> tags.
 */

interface FaIconProps {
  icon: string; // e.g. "fa-solid fa-bullseye"
  className?: string;
}

export function FaIcon({ icon, className = "" }: FaIconProps) {
  return <i className={`${icon} ${className}`} aria-hidden="true" />;
}

// ─── Semantic icon names → FA class mappings ─────────────────────────────────

export const FA = {
  // Stages
  scope: "fa-solid fa-bullseye",
  diagnose: "fa-solid fa-magnifying-glass",
  hypothesize: "fa-solid fa-lightbulb",
  analyze: "fa-solid fa-chart-column",
  synthesize: "fa-solid fa-puzzle-piece",
  communicate: "fa-solid fa-clipboard-list",
  export: "fa-solid fa-file-export",

  // Frameworks
  swot: "fa-solid fa-bullseye",
  pestel: "fa-solid fa-globe",
  porter5: "fa-solid fa-shield-halved",
  bcg: "fa-solid fa-chart-pie",
  ansoff: "fa-solid fa-chart-line",
  sipoc: "fa-solid fa-gears",
  valueChain: "fa-solid fa-link",
  rootCause: "fa-solid fa-magnifying-glass-chart",

  // SWOT quadrant icons
  strengths: "fa-solid fa-hand-fist",
  weaknesses: "fa-solid fa-triangle-exclamation",
  opportunities: "fa-solid fa-star",
  threats: "fa-solid fa-fire",

  // PESTEL factor icons
  political: "fa-solid fa-landmark",
  economic: "fa-solid fa-coins",
  social: "fa-solid fa-users",
  technological: "fa-solid fa-wrench",
  environmental: "fa-solid fa-seedling",
  legal: "fa-solid fa-scale-balanced",

  // Porter's 5 Forces
  rivalry: "fa-solid fa-shield-halved",
  newEntrants: "fa-solid fa-door-open",
  buyers: "fa-solid fa-cart-shopping",
  suppliers: "fa-solid fa-industry",
  substitutes: "fa-solid fa-arrows-rotate",

  // BCG Matrix
  star: "fa-solid fa-star",
  cashCow: "fa-solid fa-piggy-bank",
  questionMark: "fa-solid fa-circle-question",
  dog: "fa-solid fa-dog",

  // Analysis types
  descriptive: "fa-solid fa-clipboard-list",
  comparative: "fa-solid fa-scale-balanced",
  causal: "fa-solid fa-microscope",

  // Misc
  compass: "fa-solid fa-compass",
  check: "fa-solid fa-check",
  warning: "fa-solid fa-triangle-exclamation",
} as const;
