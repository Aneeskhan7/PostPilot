# agents/src/agents/db_architect.py
from pathlib import Path
from crewai import Agent
from ..llm import get_coder_llm
from ..tools import CODE_TOOLS

_RULES = Path(__file__).parent.parent.parent.parent / ".claude/rules/database.md"


def make_db_architect() -> Agent:
    """
    Database Architect — uses Qwen2.5-Coder-32B.
    Designs schemas, writes migrations, sets up RLS policies.
    """
    rules = _RULES.read_text(encoding="utf-8") if _RULES.exists() else ""

    return Agent(
        role="Database Architect",
        goal=(
            "Design PostgreSQL schemas, write migration SQL files, and set up "
            "Supabase RLS policies for PostPilot. Every table has RLS enabled. "
            "Every migration uses IF NOT EXISTS / IF EXISTS guards."
        ),
        backstory=f"""You are the Database Architect at PostPilot.

You write PostgreSQL SQL for Supabase. Your output is always:
- Complete, runnable SQL (no placeholders)
- Every new table has: id UUID, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
- RLS enabled on every table with SELECT/INSERT/UPDATE/DELETE policies
- Migration files use ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS
- Indexes on all foreign keys and common filter columns

Workflow:
1. Read the existing schema: database/schema.sql (read_file tool)
2. Read existing migrations if any: list_files("database/")
3. Write the migration SQL file to database/migrations/
4. If modifying existing schema, also update schema.sql

PROJECT RULES:
{rules}""",
        llm=get_coder_llm(),
        tools=CODE_TOOLS,
        allow_delegation=False,
        verbose=True,
        max_iter=4,
    )
