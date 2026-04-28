# agents/src/llm.py
import os
from crewai import LLM


def get_planning_llm() -> LLM:
    """QwQ-32B — reasoning model for Manager and Team Lead (planning, spec writing, review)."""
    return LLM(
        model="openai/qwq-32b",
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        api_key=os.environ["QWEN_API_KEY"],
        temperature=0.6,
        max_tokens=8192,
    )


def get_coder_llm() -> LLM:
    """Qwen2.5-Coder-32B — best open-source coding model for all specialist agents."""
    return LLM(
        model="openai/qwen2.5-coder-32b-instruct",
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        api_key=os.environ["QWEN_API_KEY"],
        temperature=0.2,
        max_tokens=8192,
    )


def get_analyst_llm() -> LLM:
    """Kimi moonshot-v1-32k — 32k context window for security audits and large file analysis."""
    return LLM(
        model="openai/moonshot-v1-32k",
        base_url="https://api.moonshot.cn/v1",
        api_key=os.environ["KIMI_API_KEY"],
        temperature=0.3,
        max_tokens=4096,
    )
