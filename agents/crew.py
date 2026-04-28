# agents/crew.py
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from crewai import Crew, Process

from src.agents.manager import make_manager
from src.agents.team_lead import make_team_lead
from src.agents.frontend_dev import make_frontend_dev
from src.agents.backend_dev import make_backend_dev
from src.agents.db_architect import make_db_architect
from src.agents.security_auditor import make_security_auditor
from src.agents.test_runner import make_test_runner

from src.tasks.manager_tasks import make_manager_analysis_task, make_manager_review_task
from src.tasks.team_lead_tasks import make_team_lead_task
from src.llm import get_planning_llm


def run(developer_request: str) -> str:
    """
    Full pipeline:
      Manager analyzes → Team Lead implements → Manager reviews

    The Team Lead uses allow_delegation=True so CrewAI's hierarchical manager
    automatically routes subtasks to the right specialist.
    """

    # ── Build agents ──────────────────────────────────────────────────────────
    manager        = make_manager()
    team_lead      = make_team_lead()
    frontend_dev   = make_frontend_dev()
    backend_dev    = make_backend_dev()
    db_architect   = make_db_architect()
    security_auditor = make_security_auditor()
    test_runner    = make_test_runner()

    # ── Build tasks ───────────────────────────────────────────────────────────
    analysis_task = make_manager_analysis_task(manager, developer_request)
    impl_task     = make_team_lead_task(team_lead)
    review_task   = make_manager_review_task(manager)

    # Wire context: each task reads the previous task's output
    impl_task.context   = [analysis_task]
    review_task.context = [analysis_task, impl_task]

    # ── Assemble crew ─────────────────────────────────────────────────────────
    # Hierarchical process: get_planning_llm (QwQ) acts as the meta-orchestrator.
    # It sees all agents and all tasks, automatically delegating subtasks from
    # impl_task to frontend_dev / backend_dev / db_architect / security_auditor
    # / test_runner based on Team Lead's delegation calls.
    crew = Crew(
        agents=[
            manager,
            team_lead,
            frontend_dev,
            backend_dev,
            db_architect,
            security_auditor,
            test_runner,
        ],
        tasks=[analysis_task, impl_task, review_task],
        process=Process.hierarchical,
        manager_llm=get_planning_llm(),
        verbose=True,
        full_output=True,
        memory=False,
    )

    result = crew.kickoff()
    return str(result)
