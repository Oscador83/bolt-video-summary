// Single source of truth for AI model IDs and human-readable labels.
// When you want to upgrade models, edit ONLY this file.
//
// Uses OpenRouter for text (free tier) and Pollinations.ai for images (free, no API key).

export const TEXT_MODEL_ID = "google/gemini-2.0-flash-exp:free";
export const TEXT_MODEL_LABEL = "Gemini 2.0 Flash";

export const IMAGE_MODEL_ID = "pollinations";
export const IMAGE_MODEL_LABEL = "Pollinations AI";
