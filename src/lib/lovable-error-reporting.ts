// Simple error logging - no external service needed

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[Error]", error, context);
}

// Legacy alias for backwards compatibility with existing imports
export const reportLovableError = reportError;
