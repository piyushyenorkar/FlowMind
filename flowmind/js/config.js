// ============================================================
//  FlowMind — API Configuration
//  Replace the values below with your actual API keys
// ============================================================

const CONFIG = {
  // ── Groq LLM (free tier) ──────────────────────────────────
  // Get your key at: https://console.groq.com
  GROQ_API_KEY: "YOUR_GROQ_API_KEY_HERE",
  GROQ_MODEL: "qwen/qwen3.8-27b", // fast & capable

  // ── Hindsight Memory (by Vectorize) ──────────────────────
  // Get your key at: https://ui.hindsight.vectorize.io
  // Promo code for $50 free: MEMHACK315
  HINDSIGHT_API_KEY: "YOUR_HINDSIGHT_API_KEY_HERE",
  HINDSIGHT_BASE_URL: "https://api.hindsight.vectorize.io/v1",

  // ── App Settings ─────────────────────────────────────────
  APP_NAME: "FlowMind",
  APP_VERSION: "1.0.0",
  DEMO_TEAM_CODE: "FLOW-DEMO",
};

export default CONFIG;
