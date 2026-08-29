import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes in-memory freshness for instant page transitions
        gcTime: 1000 * 60 * 30, // 30 minutes cache retention
        refetchOnWindowFocus: false, // Prevent background refetch freezes
        refetchOnMount: false, // Instant navigation using warm cache
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent", // Preload route chunks & data on hover/touch
    defaultPreloadDelay: 50,
    defaultPreloadStaleTime: 1000 * 60 * 10,
  });

  return router;
};
