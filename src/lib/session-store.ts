// Typed localStorage persistence with a schema version.
// Stores the entire app session so a window resize / refresh never loses work.

export type Length = "short" | "standard" | "detailed";
export type Detail = "simple" | "medium" | "detailed";
export type VisualStatus = "idle" | "loading" | "done" | "error";
export type TextStatus = "idle" | "loading" | "done" | "error";
export type ChatMsg = { role: "user" | "assistant"; content: string };

export type Card = {
  id: string;
  url: string;
  length: Length;
  customInstructions: string;
  videoId: string | null;
  title: string | null;
  author: string | null;
  detectedLang: string | null;
  transcript: string | null;
  textStatus: TextStatus;
  text: string | null;
  textError: string | null;
  translated: { lang: string; content: string } | null;
  videoOpen: boolean;
  visualOpen: boolean;
  visualDetail: Detail;
  visualStatus: VisualStatus;
  visualSrc: string | null;
  visualFinal: boolean;
  visualError: string | null;
  chat: ChatMsg[];
};

export type GlobalSection = {
  status: TextStatus | "stale";
  summary: string | null;
  error: string | null;
  visualStatus: VisualStatus;
  visualSrc: string | null;
  visualFinal: boolean;
  visualDetail: Detail;
  visualError: string | null;
  chat: ChatMsg[];
  useTranscripts: boolean;
};

export type Session = {
  v: 1;
  autoSummarize: boolean;
  multiMode: boolean;
  theme: "light" | "dark";
  targetLang: string;
  cards: Card[];
  global: GlobalSection | null;
};

const KEY = "osvidsum:session:v1";

export function makeEmptyCard(): Card {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
    url: "",
    length: "standard",
    customInstructions: "",
    videoId: null,
    title: null,
    author: null,
    detectedLang: null,
    transcript: null,
    textStatus: "idle",
    text: null,
    textError: null,
    translated: null,
    videoOpen: false,
    visualOpen: false,
    visualDetail: "medium",
    visualStatus: "idle",
    visualSrc: null,
    visualFinal: false,
    visualError: null,
    chat: [],
  };
}

export function makeEmptyGlobal(): GlobalSection {
  return {
    status: "idle",
    summary: null,
    error: null,
    visualStatus: "idle",
    visualSrc: null,
    visualFinal: false,
    visualDetail: "medium",
    visualError: null,
    chat: [],
    useTranscripts: false,
  };
}

export function defaultSession(): Session {
  return {
    v: 1,
    autoSummarize: true,
    multiMode: false,
    theme: "light",
    targetLang: "English",
    cards: [makeEmptyCard()],
    global: null,
  };
}

export function loadSession(): Session {
  if (typeof window === "undefined") return defaultSession();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSession();
    const parsed = JSON.parse(raw) as Session;
    if (parsed?.v !== 1 || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
      return defaultSession();
    }
    return parsed;
  } catch {
    return defaultSession();
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function saveSession(s: Session) {
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      // Likely quota — fall back to a slimmed-down version dropping images.
      try {
        const slim: Session = {
          ...s,
          cards: s.cards.map((c) => ({ ...c, visualSrc: null, visualStatus: "idle", visualFinal: false })),
          global: s.global
            ? { ...s.global, visualSrc: null, visualStatus: "idle", visualFinal: false }
            : null,
        };
        localStorage.setItem(KEY, JSON.stringify(slim));
      } catch {
        /* ignore */
      }
    }
  }, 250);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
