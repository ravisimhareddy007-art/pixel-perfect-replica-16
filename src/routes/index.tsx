import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LifePack AI — Personal Document Intelligence" },
      { name: "description", content: "Classify, track, and assemble your documents for real life events. Includes a hallucination-safe Healthcare module." },
      { property: "og:title", content: "LifePack AI" },
      { property: "og:description", content: "AI-powered personal document intelligence." },
    ],
  }),
  component: Index,
});

function Index() {
  return <App />;
}
