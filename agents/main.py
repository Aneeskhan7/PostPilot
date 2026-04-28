#!/usr/bin/env python3
# agents/main.py — PostPilot Multi-Agent System entry point
#
# Usage:
#   python main.py "Add a notifications page to the frontend"
#   python main.py  ← interactive mode

import sys
import os
from pathlib import Path

# Ensure agents/ is in Python path
sys.path.insert(0, str(Path(__file__).parent))

# Load .env from agents/.env
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

# Validate env based on mode
_mode = os.environ.get("AGENT_MODE", "ollama").lower()
if _mode == "cloud":
    _required = {"QWEN_API_KEY": "Qwen/DashScope — https://dashscope.aliyun.com/",
                 "KIMI_API_KEY":  "Kimi/Moonshot — https://platform.moonshot.cn/"}
    _missing = {k: v for k, v in _required.items() if not os.environ.get(k)}
    if _missing:
        print("\nERROR: AGENT_MODE=cloud but API keys are missing in agents/.env\n")
        for key, url in _missing.items():
            print(f"  {key}  →  get from {url}")
        sys.exit(1)
else:
    ollama_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    print(f"Mode: Ollama (local)  —  {ollama_url}")

from crew import run


BANNER = """
╔══════════════════════════════════════════════╗
║    PostPilot Multi-Agent System              ║
║    Manager → Team Lead → Specialists         ║
║    Models: QwQ-32B · Qwen2.5-Coder · Kimi   ║
╚══════════════════════════════════════════════╝
"""


def main() -> None:
    print(BANNER)

    if len(sys.argv) > 1:
        task = " ".join(sys.argv[1:])
        print(f"Task: {task}\n")
    else:
        print("Describe the feature or bug fix you want built:\n")
        task = input("  > ").strip()
        if not task:
            print("No task provided. Exiting.")
            sys.exit(0)

    print("\n" + "─" * 48)
    print("Starting crew...")
    print("─" * 48 + "\n")

    result = run(task)

    print("\n" + "═" * 48)
    print("FINAL RESULT")
    print("═" * 48)
    print(result)
    print("═" * 48 + "\n")


if __name__ == "__main__":
    main()
