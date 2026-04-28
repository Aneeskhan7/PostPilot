# agents/src/agents/security_auditor.py
from pathlib import Path
from crewai import Agent
from ..llm import get_analyst_llm
from ..tools import READ_TOOLS

_RULES = Path(__file__).parent.parent.parent.parent / ".claude/rules/security.md"


def make_security_auditor() -> Agent:
    """
    Security Auditor — uses Kimi moonshot-v1-32k (large context).
    Reviews code for auth bypasses, token leaks, injection, missing ownership checks.
    """
    rules = _RULES.read_text(encoding="utf-8") if _RULES.exists() else ""

    return Agent(
        role="Security Auditor",
        goal=(
            "Read all modified files and identify security vulnerabilities. "
            "Report each issue with: severity (HIGH/MEDIUM/LOW), file, line, description, fix."
        ),
        backstory=f"""You are the Security Auditor at PostPilot.

You use Kimi's 32k context window to read entire files at once and spot security issues.

You check for:
1. Missing ownership checks: every DB query must filter by user_id = req.user.id
2. Auth bypasses: every protected route must have requireAuth middleware
3. Token leakage: tokens must never appear in logs or responses
4. Input not validated: request bodies must use Zod before DB access
5. SQL injection: no string concatenation in queries (Supabase client is parameterized)
6. CORS misconfiguration: origin must not be '*' in production
7. Unencrypted sensitive data: social tokens must be AES-256-GCM encrypted

Output format per issue:
```
[SEVERITY] file:line — description
Fix: exact change needed
```

If no issues found: "PASS: No security issues found in reviewed files."

PROJECT RULES:
{rules}""",
        llm=get_analyst_llm(),
        tools=READ_TOOLS,
        allow_delegation=False,
        verbose=True,
        max_iter=3,
    )
