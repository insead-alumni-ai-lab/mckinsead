import { router } from "../lib/trpc";
import { engagementRouter } from "./engagement";
import { frameworksRouter } from "./frameworks";
import { hypothesisRouter } from "./hypothesis";
import { deckRouter } from "./deck";
import { analysisRouter } from "./analysis";
import { critiqueRouter } from "./critique";
import { authRouter } from "./auth";

export const appRouter = router({
  engagement: engagementRouter,
  frameworks: frameworksRouter,
  hypothesis: hypothesisRouter,
  deck: deckRouter,
  analysis: analysisRouter,
  critique: critiqueRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
