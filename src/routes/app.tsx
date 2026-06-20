import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "LifePack AI — Your Vault" },
      { name: "description", content: "Your personal document vault. Classify, track, and assemble for any life event." },
    ],
  }),
  component: () => <App />,
});