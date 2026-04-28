# agents/src/tasks/team_lead_tasks.py
from crewai import Task, Agent


def make_team_lead_task(team_lead: Agent) -> Task:
    return Task(
        description="""
You have received the technical spec from the Engineering Manager (see context).

Your job:
1. Read all files mentioned in the spec using read_file and list_files tools
2. Create a concrete implementation plan
3. Delegate to the right specialists — only the ones the spec says are needed
4. For each delegation, provide:
   - The exact file path(s) to create or modify
   - The relevant portion of the spec for that specialist
   - Snippets of existing code they need to understand
5. After each specialist finishes, verify their output:
   - Run: run_command("npx tsc --noEmit", "frontend") if frontend was changed
   - Run: run_command("npx tsc --noEmit", "backend") if backend was changed
6. If compilation fails, send the exact error output back to the specialist for fixes
7. Report to the manager:
   - Complete list of modified files
   - TypeScript status for each layer
   - Any issues encountered

Remember: you do NOT write code yourself. You plan and delegate only.
""",
        expected_output=(
            "Implementation complete. List of all files created/modified, "
            "TypeScript compilation status, and any issues."
        ),
        agent=team_lead,
    )
