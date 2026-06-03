import { router } from "../lib/trpc";
import { engagementRouter } from "./engagement";
import { frameworksRouter } from "./frameworks";
import { hypothesisRouter } from "./hypothesis";
import { deckRouter } from "./deck";

export const appRouter = router({
  engagement: engagementRouter,
  frameworks: frameworksRouter,
  hypothesis: hypothesisRouter,
  deck: deckRouter,
});

export type AppRouter = typeof appRouter;
