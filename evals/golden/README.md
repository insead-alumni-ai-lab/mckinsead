# Golden Test Data

## Purpose
Golden engagement objects used for regression testing.
Each JSON file represents a complete engagement at a specific stage.

## Convention
- `{scenario}-{stage}.json` — e.g., `market-entry-scoping.json`
- Each file must be a valid `EngagementObject` per `@mckinsead/schemas`

## Scenarios (Planned)
1. **Market Entry** — "Should ACME enter the European market?" (Full 7-stage walkthrough)
2. **Portfolio Optimization** — "Which BUs to invest/harvest/divest?" (BCG + Value Chain heavy)
3. **Turnaround** — "Root cause of margin erosion" (Root Cause + SIPOC heavy)

## Adding Golden Data
1. Run a full engagement through the cockpit
2. Export the final Engagement Object JSON
3. Validate: `npx ts-node scripts/validate-golden.ts evals/golden/{file}.json`
4. Add to this directory
