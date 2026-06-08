// Public CORS proxies used as a best-effort fallback for YouTube transcript fetches
// when the server-side path is blocked. These are third-party services that
// can rate-limit, go offline, or change behavior at any time.

export type ProxyFn = (url: string) => string;

export const CORS_PROXIES: ProxyFn[] = [
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://r.jina.ai/${u}`,
  (u) => `https://cors.lol/?url=${encodeURIComponent(u)}`,
];

export type FallbackOutcome =
  | { kind: "ok"; transcript: string; lang: string | null }
  | { kind: "no-captions" }
  | { kind: "all-blocked" };

export async function fetchTranscriptViaProxy(
  videoId: string,
): Promise<FallbackOutcome> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  let sawCaptionsAbsent = false;
  let anyResponse = false;

  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy(watchUrl), { method: "GET" });
      if (!res.ok) continue;
      anyResponse = true;
      const html = await res.text();
      const m = html.match(/"captionTracks":(\[[^\]]+\])/);
      if (!m) {
        // Page loaded but no captionTracks → likely no captions for this video.
        sawCaptionsAbsent = true;
        continue;
      }
      let tracks: Array<{ baseUrl: string; languageCode?: string }>;
      try {
        tracks = JSON.parse(m[1].replace(/\\u0026/g, "&"));
      } catch {
        continue;
      }
      if (!tracks.length) {
        sawCaptionsAbsent = true;
        continue;
      }
      const pref = ["en", "es", "ca", "fr"];
      const track =
        tracks.find((t) => pref.includes(t.languageCode ?? "")) ?? tracks[0];

      const xmlRes = await fetch(proxy(track.baseUrl));
      if (!xmlRes.ok) continue;
      const xml = await xmlRes.text();
      const text = xml
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length < 20) continue;
      return { kind: "ok", transcript: text, lang: track.languageCode ?? null };
    } catch {
      continue;
    }
  }

  if (sawCaptionsAbsent && anyResponse) return { kind: "no-captions" };
  return { kind: "all-blocked" };
}
