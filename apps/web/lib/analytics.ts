import posthog from "posthog-js";

// Only initialize PostHog in the browser
if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || "your_project_key", {
    api_host: "https://app.posthog.com",
    capture_pageview: true,
    // Load PostHog before sending first event
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") {
        // In development, let's be verbose about the events
        posthog.debug();
      }
    },
  });
}

// Helper functions to track events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== "undefined") {
    posthog.capture(eventName, properties);
  }
};

export const trackPageView = (pageName: string) => {
  trackEvent("page_view", { page: pageName });
};

export const trackBroadcastView = (broadcastId: string) => {
  trackEvent("broadcast_viewed", { broadcast_id: broadcastId });
};

export const trackPersonaView = (personaId: string) => {
  trackEvent("persona_viewed", { persona_id: personaId });
};

export const trackShare = (type: "broadcast" | "persona", id: string) => {
  trackEvent("content_shared", { type, id });
};

// Export posthog instance for advanced usage
export const analytics = posthog;

export default {
  trackEvent,
  trackPageView,
  trackBroadcastView,
  trackPersonaView,
  trackShare,
};
