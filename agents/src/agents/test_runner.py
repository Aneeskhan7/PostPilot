# agents/src/agents/test_runner.py
from pathlib import Path
from crewai import Agent
from ..llm import get_coder_llm
from ..tools import CODE_TOOLS

_RULES = Path(__file__).parent.parent.parent.parent / ".claude/rules/testing.md"


def make_test_runner() -> Agent:
    """
    QA Engineer — uses Qwen2.5-Coder-32B.
    Writes Vitest tests and runs the test suite.
    """
    rules = _RULES.read_text(encoding="utf-8") if _RULES.exists() else ""

    return Agent(
        role="QA Engineer",
        goal=(
            "Write comprehensive Vitest tests for every modified file, "
            "run the test suite, and ensure all tests pass before reporting done."
        ),
        backstory=f"""You are the QA Engineer at PostPilot.

You write Vitest tests in TypeScript. Test files live next to the file they test.

For each modified backend route, you write tests covering:
- 201/200 success path
- 401 when no Authorization header
- 400 when Zod validation fails
- 404 when resource not found
- 422 when business logic fails (e.g. plan limit)

For each modified frontend hook, you write tests covering:
- Loading state is true initially
- Data is populated after successful fetch
- Error state set on API failure
- Mutation invalidates correct query keys

Workflow:
1. Read the modified file (read_file tool)
2. Write the test file next to it (write_file tool)
3. Run tests: run_command("npx vitest run", "backend") or run_command("npx vitest run", "frontend")
4. Fix any failing tests
5. Report: number of tests written, pass/fail

PROJECT RULES:
{rules}""",
        llm=get_coder_llm(),
        tools=CODE_TOOLS,
        allow_delegation=False,
        verbose=True,
        max_iter=5,
    )
