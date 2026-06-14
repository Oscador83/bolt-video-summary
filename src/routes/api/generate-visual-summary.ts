import { createFileRoute } from "@tanstack/react-router";

const DETAIL_GUIDANCE: Record<string, string> = {
  simple:
    "Style: minimalist sketch. Use 3-5 simple labeled icons or shapes connected with thin arrows. Plenty of white space. Hand-drawn feel.",
  medium:
    "Style: clean infographic. Use 5-8 labeled boxes/circles/icons grouped into 2-3 sections, connected with arrows showing relationships. Balanced layout, readable labels.",
  detailed:
    "Style: rich, dense infographic / mind map. Use 10-15 labeled elements organized into clear clusters with arrows, sub-arrows and short text annotations showing flow and hierarchy. Like a tutorial whiteboard.",
};

export const Route = createFileRoute("/api/generate-visual-summary")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          summary?: string;
          title?: string | null;
          detail?: "simple" | "medium" | "detailed";
        };
        const summary = (body.summary ?? "").trim();
        if (!summary) return new Response("Missing summary", { status: 400 });
        const detail = body.detail ?? "medium";

        // Build a concise prompt for Pollinations
        const prompt = `Create a visual summary infographic diagram${body.title ? ` for video "${body.title}"` : ""}. ${DETAIL_GUIDANCE[detail]} Clean light background, dark text, one accent color. Self-explanatory at a glance. Key points: ${summary.slice(0, 500)}`;

        // Pollinations.ai - completely free, no API key needed
        // Using flux model for high quality
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Date.now()}&nologo=true&model=flux`;

        try {
          const imageRes = await fetch(pollinationsUrl, {
            method: "GET",
          });

          if (!imageRes.ok) {
            return new Response(`Image generation failed (${imageRes.status})`, { status: 500 });
          }

          const imageBuffer = await imageRes.arrayBuffer();
          const base64 = Buffer.from(imageBuffer).toString("base64");
          const dataUrl = `data:image/png;base64,${base64}`;

          // Return SSE-style response to match the expected format in the frontend
          // The frontend expects image_generation.completed event with b64_json
          const sseResponse = `event: image_generation.partial_image
data: {"b64_json": "${base64.slice(0, 100)}..."}

event: image_generation.completed
data: {"b64_json": "${base64}"}
`;

          return new Response(sseResponse, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
            },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return new Response(`Image generation failed: ${msg}`, { status: 500 });
        }
      },
    },
  },
});
