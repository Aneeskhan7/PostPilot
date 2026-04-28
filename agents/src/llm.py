# agents/src/llm.py
#
# MODE is controlled by the AGENT_MODE env var in agents/.env:
#   AGENT_MODE=ollama   → 100% local, free, unlimited (requires Ollama running)
#   AGENT_MODE=cloud    → Qwen DashScope API + Kimi API (cloud, needs API keys)
#
import os
from crewai import LLM

_MODE = os.environ.get("AGENT_MODE", "ollama").lower()

# ── Model name overrides via .env ─────────────────────────────────────────────
# Change these if you pulled different sizes (e.g. qwen2.5-coder:7b for low VRAM)
_PLANNING_MODEL = os.environ.get("OLLAMA_PLANNING_MODEL", "qwq:32b")
_CODER_MODEL    = os.environ.get("OLLAMA_CODER_MODEL",    "qwen2.5-coder:32b")
_ANALYST_MODEL  = os.environ.get("OLLAMA_ANALYST_MODEL",  "qwen2.5:32b")
_OLLAMA_URL     = os.environ.get("OLLAMA_BASE_URL",       "http://localhost:11434")


def get_planning_llm() -> LLM:
    """
    Manager + Team Lead — reasoning model.
    Ollama: qwq:32b   |   Cloud: QwQ-32B via DashScope
    """
    if _MODE == "ollama":
        return LLM(
            model=f"ollama/{_PLANNING_MODEL}",
            base_url=_OLLAMA_URL,
            temperature=0.6,
        )
    return LLM(
        model="openai/qwq-32b",
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        api_key=os.environ["QWEN_API_KEY"],
        temperature=0.6,
        max_tokens=8192,
    )


def get_coder_llm() -> LLM:
    """
    All 5 specialist agents — coding model.
    Ollama: qwen2.5-coder:32b   |   Cloud: Qwen2.5-Coder-32B via DashScope
    """
    if _MODE == "ollama":
        return LLM(
            model=f"ollama/{_CODER_MODEL}",
            base_url=_OLLAMA_URL,
            temperature=0.2,
        )
    return LLM(
        model="openai/qwen2.5-coder-32b-instruct",
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        api_key=os.environ["QWEN_API_KEY"],
        temperature=0.2,
        max_tokens=8192,
    )


def get_analyst_llm() -> LLM:
    """
    Security Auditor — large-context analysis model.
    Ollama: qwen2.5:32b (replaces Kimi)   |   Cloud: Kimi moonshot-v1-32k
    Note: Kimi has no open-source local version — Qwen2.5:32b is the best local substitute.
    """
    if _MODE == "ollama":
        return LLM(
            model=f"ollama/{_ANALYST_MODEL}",
            base_url=_OLLAMA_URL,
            temperature=0.3,
        )
    return LLM(
        model="openai/moonshot-v1-32k",
        base_url="https://api.moonshot.cn/v1",
        api_key=os.environ["KIMI_API_KEY"],
        temperature=0.3,
        max_tokens=4096,
    )
