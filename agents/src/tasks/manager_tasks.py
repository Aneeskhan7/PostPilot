# agents/src/tasks/manager_tasks.py
from crewai import Task, Agent


def make_manager_analysis_task(manager: Agent, developer_request: str) -> Task:
    return Task(
        description=f"""
The developer has requested:
---
{developer_request}
---

Your job:
1. Use list_files and read_file tools to read all files relevant to this request
2. Write a technical specification in this exact format:

## Feature: [short name]

### Context
[What currently exists, what this request changes]

### Files to Create or Modify
- [path] — [what changes and why]
- [path] — [what changes and why]

### Acceptance Criteria
- [ ] [specific, testable outcome]
- [ ] [specific, testable outcome]

### Which Specialists Are Needed
- [ ] Frontend Developer — [yes/no and why]
- [ ] Backend Developer — [yes/no and why]
- [ ] Database Architect — [yes/no and why]
- [ ] Security Auditor — [yes/no and why]
- [ ] QA Engineer — [yes/no and why]

### Security Considerations
[Any auth checks, ownership checks, or validation required]

3. The Tech Lead will receive this spec and implement it.
""",
        expected_output=(
            "A complete technical specification document with file list, "
            "acceptance criteria, and specialist assignment."
        ),
        agent=manager,
    )


def make_manager_review_task(manager: Agent) -> Task:
    return Task(
        description="""
Review the completed work from the Tech Lead.

1. Read all files the Tech Lead listed as modified (use read_file tool)
2. Run TypeScript compilation:
   - run_command("npx tsc --noEmit", "frontend")
   - run_command("npx tsc --noEmit", "backend")
3. Check each acceptance criterion from your spec

If compilation fails or criteria are not met:
- List the exact failures
- This is a FAIL — report issues clearly

If everything passes:
- Write a summary for the developer

Report format:
## Result: PASS / FAIL

### Files Changed
- [path] (new/modified)

### TypeScript
- frontend: PASS / FAIL — [errors if any]
- backend: PASS / FAIL — [errors if any]

### Acceptance Criteria
- [x] [met criterion]
- [ ] [unmet criterion — description]

### How to Test
[Command to run or URL to visit]

### Notes
[Any gaps, follow-up items, or known limitations]
""",
        expected_output="A PASS or FAIL review report with TypeScript status and acceptance criteria results.",
        agent=manager,
    )
