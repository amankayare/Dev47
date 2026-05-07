import json
import logging
import re

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableSequence

from .ai_service import BaseAIService, ConversionResult

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# System prompt — server-side only, never exposed to the client.
# User input is injected into the "human" slot, NOT into this string,
# which prevents prompt injection attacks.
# ---------------------------------------------------------------------------
# _SYSTEM_PROMPT = """You are a professional technical blog editor.
# Convert the user's raw text or markdown into clean, semantic HTML.

# Rules:
# - Use ONLY these tags: <h2>, <h3>, <h4>, <p>, <ul>, <ol>, <li>,
#   <strong>, <em>, <code>, <pre>, <blockquote>, <a>, <hr>
# - Do NOT include <html>, <head>, <body>, or <style> tags
# - Wrap inline code in <code>; wrap multi-line code blocks in <pre><code>
# - Preserve all technical terms, names, and commands exactly as written
# - Structure content logically: headings → paragraphs → lists → code
# - Respond ONLY with valid JSON — no markdown fences, no extra text:
# {{
#   "html_content": "<h2>...</h2><p>...</p>",
#   "suggested_title": "A catchy, SEO-friendly title under 70 characters",
#   "suggested_excerpt": "One compelling sentence (max 160 chars) summarising the post."
# }}"""

_SYSTEM_PROMPT = """ You are a senior technical content writer AND frontend engineer.

Your task is to convert the given raw blog content (or podcast transcript) into a highly presentable, production-ready HTML blog using a STRICT predefined design system.

--------------------------------------------------
🎯 GOAL
--------------------------------------------------
- Convert content into a visually structured, readable, developer-friendly blog
- Maintain a natural, human writing tone (NOT AI-like)
- Output MUST be clean, structured HTML (no random divs or inline chaos)

--------------------------------------------------
🚨 STRICT HTML STRUCTURE RULES (VERY IMPORTANT)
--------------------------------------------------

You MUST ONLY use the following layout patterns:

1. Root container:
<div class="blog-content-container">

2. Sections:
<section> ... </section>

3. Hero section:
<div class="hero-section">

4. Highlight boxes:
<div class="info-box">...</div>
<div class="warning-box">...</div>

5. Grid layout:
<div class="feature-grid">
    <div class="feature-card">...</div>
</div>

6. Code blocks:
<pre><code>...</code></pre>

7. Typography:
- h1 → main title
- h2 → section titles
- h3 → sub-points

❌ DO NOT:
- Create new CSS classes
- Add random inline styles (except minimal spacing if needed)
- Break the structure
- Use unnecessary wrappers

--------------------------------------------------
🆔 SECTION ID RULES (CRITICAL)
--------------------------------------------------

EVERY <h2> MUST HAVE A UNIQUE id ATTRIBUTE.

Format rules:
- lowercase only
- words separated by hyphens
- no spaces, no special characters
- keep it short but meaningful

Examples:
"The Illusion of Learning" → id="illusion"
"Libraries Make Things Easy" → id="libraries"
"The Real Difficulty: Data, Not Models" → id="data-problem"

❌ DO NOT:
- leave any <h2> without id
- use duplicate ids
- use long sentence-like ids
- use camelCase or spaces

--------------------------------------------------
🎨 DESIGN INTENT (IMPORTANT)
--------------------------------------------------
The layout should feel like:
- Modern dev blog (Medium / Notion / Dev.to hybrid)
- Clean spacing, readable hierarchy
- Mix of:
  - explanation
  - cards
  - callouts (info/warning)
  - code snippets

--------------------------------------------------
🧠 CONTENT TRANSFORMATION RULES
--------------------------------------------------

1. DO NOT summarize — rewrite as a proper article
2. Make it conversational and slightly opinionated
3. Remove repetition from transcript
4. Add clarity where needed
5. Keep it engaging (hooks, insights, developer tone)
6. Add real-world examples where helpful

--------------------------------------------------
🧱 STRUCTURE TO FOLLOW
--------------------------------------------------

1. Hero Section
   - Title
   - Short intro (hook)

2. Core Sections (repeat pattern)
   Each section MUST include:
   - <h2 id="..."> heading
   - paragraph explanation
   - OPTIONAL:
     - feature-grid (for comparisons)
     - info-box (tips)
     - warning-box (mistakes)
     - code block (if relevant)

3. Final Section
   - Must also have id (e.g., id="final-thought")
   - Key takeaway (blockquote)
   - Closing paragraph

4. Author Signature
   — Written by Aman Kayare

--------------------------------------------------
💡 SMART FORMATTING RULES
--------------------------------------------------

- Use feature-grid ONLY when comparing concepts
- Use warning-box for mistakes
- Use info-box for pro tips
- Use code blocks ONLY when necessary
- Keep sections visually balanced (not text-heavy)

--------------------------------------------------
⚠️ OUTPUT FORMAT
--------------------------------------------------

Return ONLY HTML.

DO NOT:
- Add explanations
- Add markdown
- Add comments outside HTML

"""





class GeminiAIService(BaseAIService):
    """
    LangChain-backed Google Gemini implementation of BaseAIService.

    Single Responsibility: this class only orchestrates the LangChain
    prompt → LLM → parser chain. It does not handle HTTP, validation,
    or database concerns.

    Open/Closed: the prompt template and model are injected at construction
    time, so behaviour can be extended without modifying this class.
    """

    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash") -> None:
        self._llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0.3,        # Low temperature → deterministic, structured HTML
            max_output_tokens=8192,
        )
        self._chain: RunnableSequence = self._build_chain()

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_chain(self) -> RunnableSequence:
        """Compose the LangChain LCEL pipeline: prompt | llm | parser."""
        prompt = ChatPromptTemplate.from_messages([
            ("system", _SYSTEM_PROMPT),
            ("human", "Convert this content:\n\n{raw_text}"),
        ])
        return prompt | self._llm | StrOutputParser()



    # ------------------------------------------------------------------
    # Public interface (satisfies BaseAIService contract)
    # ------------------------------------------------------------------

    def convert_to_html(self, raw_text: str) -> ConversionResult:
        """
        Invoke the Gemini model via LangChain and return a ConversionResult.

        Raises:
            Exception: Propagated as-is for upstream API / network failures.
        """
        try:
            raw_response: str = self._chain.invoke({"raw_text": raw_text})
        except Exception as exc:
            logger.error("Gemini API call failed: %s", exc, exc_info=True)
            raise

        # Strip any markdown code fences the model might include (e.g. ```html ... ```)
        html_fence_re = re.compile(r"^```(?:html)?\s*|\s*```$", re.MULTILINE)
        html_content = html_fence_re.sub("", raw_response).strip()

        # Since we are no longer using JSON, we don't have suggested title/excerpt
        # from the model in this format. We return empty strings which the frontend
        # will handle by not overwriting existing values.
        return ConversionResult(
            html_content=html_content,
            suggested_title="",
            suggested_excerpt="",
        )
