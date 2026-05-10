# Feature State: AI Blog Conversion
**Status:** ✅ Fully Implemented (Integrated & Deployed)  
**Last Updated:** 2026-05-08

## 📖 Overview
The AI Blog Conversion feature allows administrators to transform raw notes, transcripts, or markdown into fully structured, responsive HTML blog posts. It automates the creation of SEO-friendly titles, excerpts, and estimated reading times while adhering to the site's design system.

---

## 🏗️ Architecture

### 1. Backend (Python/Flask)
- **Routes:** `POST /api/blogs/convert` (Conversion), `GET /api/blogs/convert/default-prompt` (Prompt Retrieval).
- **Service Layer:** `GeminiAIService` implemented using **LangChain** and the **Strategy pattern** (`BaseAIService`).
- **Validation:** Marshmallow-based schema (`ContentConversionSchema`) ensures raw text length and sanitizes custom prompt overrides.
- **Prompting:** Uses a complex system prompt that enforces specific CSS classes (e.g., `blog-content-container`, `hero-section`) and structured JSON output.

### 2. Frontend (React/TypeScript)
- **UI Component:** `AIContentDraft.tsx` handles raw text input, file uploads (.md/.txt), and the optional system prompt editor.
- **Custom Hook:** `useAIConvert.ts` manages the API lifecycle and error mapping.
- **User Experience:**
  - **Auto-Switching:** Automatically transitions from 'AI Draft' to 'HTML Editor' upon successful conversion.
  - **Auto-Fill:** Populates Title, Excerpt, and Reading Time fields if they are currently empty.
  - **State Persistence:** The custom prompt state is lifted to `BlogsManagement.tsx` so edits survive form close/submit cycles.

---

## 🔧 Configuration (Environment Variables)
The feature requires the following keys in the `.env` file (local and VPS):
- `GEMINI_API_KEY`: Google AI Studio API Key.
- `GEMINI_MODEL`: The model identifier (e.g., `gemini-1.5-flash` or `gemini-1.5-flash-8b-latest`).

---

## 🚀 Deployment (Docker/VPS)
- **Environment Passthrough:** `docker-compose.yml` is configured to pass `GEMINI_API_KEY` and `GEMINI_MODEL` from the host `.env` to the backend container.
- **CI/CD:** Deployed via GitHub Actions to Hostinger VPS.
- **Manual Step:** The `.env` file on the VPS must be manually populated with the API keys as they are not stored in Git.

---

## ⚠️ Known Limitations & Quotas
- **Free Tier Limits:** Currently capped at **20 Requests Per Day (RPD)** per model.
- **Model Switching:** If `gemini-1.5-flash` hits its limit, switching to `gemini-1.5-flash-8b-latest` provides a separate quota.
- **JSON Formatting:** Custom prompts must preserve the JSON output format instructions to avoid parsing errors.

---

## 🛠️ File Reference
| Path | Responsibility |
|---|---|
| `server/routes/blogs.py` | API Endpoints & Auth |
| `server/utils/gemini_ai_service.py` | AI Logic & System Prompt |
| `server/utils/ai_service_factory.py` | Dependency Injection |
| `web/src/components/ui/AIContentDraft.tsx` | Draft UI & Prompt Editor |
| `web/src/hooks/useAIConvert.ts` | Frontend API Hook |
| `web/src/pages/admin/BlogsManagement.tsx` | Main State & Tab Logic |
