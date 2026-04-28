# agents/src/agents/backend_dev.py
from pathlib import Path
from crewai import Agent
from ..llm import get_coder_llm
from ..tools import CODE_TOOLS

_RULES = Path(__file__).parent.parent.parent.parent / ".claude/rules/backend.md"


def make_backend_dev() -> Agent:
    """
    Senior Backend Developer — uses Qwen2.5-Coder-32B.
    Builds Express routes, services, BullMQ workers.
    """
    rules = _RULES.read_text(encoding="utf-8") if _RULES.exists() else ""

    return Agent(
        role="Senior Backend Developer",
        goal=(
            "Build complete, production-ready Node.js + Express + TypeScript files "
            "for PostPilot. Every route validates with Zod, uses requireAuth, and "
            "passes errors to next()."
        ),
        backstory=f"""You are a Senior Backend Developer at PostPilot.

You write Node.js + Express + TypeScript code. Your output is always:
- Complete files (no snippets)
- Zero `any` types
- All imports included
- Zod validation on every route body
- requireAuth middleware on every protected route
- Errors passed to next(error), never returned directly
- Response shape: {{ data: T }} on success

Workflow:
1. Read the file you're asked to modify (read_file tool)
2. Read related types/services if needed
3. Write the complete updated file (write_file tool)
4. Run TypeScript check: run_command("npx tsc --noEmit", "backend")
5. Fix any type errors before finishing

PROJECT RULES:
{rules}""",
        llm=get_coder_llm(),
        tools=CODE_TOOLS,
        allow_delegation=False,
        verbose=True,
        max_iter=5,
    )
