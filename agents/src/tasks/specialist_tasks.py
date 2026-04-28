# agents/src/tasks/specialist_tasks.py
from crewai import Task, Agent


def make_frontend_task(frontend_dev: Agent, spec_excerpt: str) -> Task:
    return Task(
        description=f"""
Implement the frontend portion of this feature:

{spec_excerpt}

Required steps:
1. Read every existing file you will modify (read_file tool)
2. Read related hooks and types for context
3. Write the complete updated file(s) with write_file tool
4. Run: run_command("npx tsc --noEmit", "frontend")
5. Fix ALL type errors before finishing — do not stop until tsc passes

Output: complete list of files written and TypeScript status.
""",
        expected_output="Frontend files written to disk. tsc --noEmit passes.",
        agent=frontend_dev,
    )


def make_backend_task(backend_dev: Agent, spec_excerpt: str) -> Task:
    return Task(
        description=f"""
Implement the backend portion of this feature:

{spec_excerpt}

Required steps:
1. Read every existing file you will modify (read_file tool)
2. Read related services and types for context
3. Write the complete updated file(s) with write_file tool
4. Run: run_command("npx tsc --noEmit", "backend")
5. Fix ALL type errors before finishing

Output: complete list of files written and TypeScript status.
""",
        expected_output="Backend files written to disk. tsc --noEmit passes.",
        agent=backend_dev,
    )


def make_db_task(db_architect: Agent, spec_excerpt: str) -> Task:
    return Task(
        description=f"""
Design the database changes for this feature:

{spec_excerpt}

Required steps:
1. Read database/schema.sql (read_file tool)
2. List existing migrations: list_files("database/")
3. Write a new migration SQL file to database/migrations/
4. If the change is additive (new columns), also update database/schema.sql

Output: migration file path and SQL summary.
""",
        expected_output="SQL migration file written to database/migrations/.",
        agent=db_architect,
    )


def make_security_task(security_auditor: Agent, files_to_review: list[str]) -> Task:
    file_list = "\n".join(f"- {f}" for f in files_to_review)
    return Task(
        description=f"""
Audit these files for security vulnerabilities:

{file_list}

For each file:
1. Read the file (read_file tool)
2. Check: ownership checks, auth middleware, input validation, token handling, CORS

Report format per issue:
[HIGH/MEDIUM/LOW] filename:line — description
Fix: [exact fix needed]

If no issues: "PASS: No issues found."
""",
        expected_output="Security audit report: list of issues or PASS.",
        agent=security_auditor,
    )


def make_test_task(test_runner: Agent, files_to_test: list[str]) -> Task:
    file_list = "\n".join(f"- {f}" for f in files_to_test)
    return Task(
        description=f"""
Write and run Vitest tests for these modified files:

{file_list}

For each file:
1. Read the file (read_file tool)
2. Write the test file next to it (write_file tool)
3. Backend tests: run_command("npx vitest run", "backend")
4. Frontend tests: run_command("npx vitest run", "frontend")
5. Fix any failing tests

Report: number of tests written, pass/fail count.
""",
        expected_output="Test files written. All tests pass.",
        agent=test_runner,
    )
