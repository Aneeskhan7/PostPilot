# agents/src/tools.py
import os
import subprocess
from pathlib import Path
from typing import Type
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

PROJECT_ROOT = Path(os.environ.get("PROJECT_ROOT", str(Path(__file__).parent.parent.parent))).resolve()


# ── Input schemas ─────────────────────────────────────────────────────────────

class ReadFileInput(BaseModel):
    path: str = Field(description="File path relative to PostPilot project root (e.g. frontend/src/App.tsx)")


class WriteFileInput(BaseModel):
    path: str = Field(description="File path relative to PostPilot project root")
    content: str = Field(description="Complete file content to write")


class RunCommandInput(BaseModel):
    command: str = Field(description="Shell command to run (e.g. 'npx tsc --noEmit')")
    cwd: str = Field(default=".", description="Directory relative to project root (e.g. 'frontend')")


class SearchCodeInput(BaseModel):
    pattern: str = Field(description="Text or regex pattern to search for")
    directory: str = Field(default=".", description="Directory to search in (e.g. 'frontend/src')")


class ListFilesInput(BaseModel):
    directory: str = Field(description="Directory to list (e.g. 'frontend/src/pages')")


# ── Tool implementations ──────────────────────────────────────────────────────

class ReadFileTool(BaseTool):
    name: str = "read_file"
    description: str = (
        "Read the full contents of any file in the PostPilot project. "
        "Always read a file before editing it."
    )
    args_schema: Type[BaseModel] = ReadFileInput

    def _run(self, path: str) -> str:
        full = PROJECT_ROOT / path
        if not full.exists():
            return f"ERROR: File not found: {path}"
        try:
            return full.read_text(encoding="utf-8")
        except Exception as e:
            return f"ERROR reading {path}: {e}"


class WriteFileTool(BaseTool):
    name: str = "write_file"
    description: str = (
        "Write or overwrite a file in the PostPilot project. "
        "Creates parent directories automatically. "
        "Always write the COMPLETE file content."
    )
    args_schema: Type[BaseModel] = WriteFileInput

    def _run(self, path: str, content: str) -> str:
        full = PROJECT_ROOT / path
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_text(content, encoding="utf-8")
        return f"OK: {path} written ({len(content)} characters)"


class RunCommandTool(BaseTool):
    name: str = "run_command"
    description: str = (
        "Run a shell command in the project. "
        "Use for: 'npx tsc --noEmit' (TypeScript check), "
        "'npx vitest run' (tests), 'git status' (git state)."
    )
    args_schema: Type[BaseModel] = RunCommandInput

    def _run(self, command: str, cwd: str = ".") -> str:
        work_dir = PROJECT_ROOT / cwd
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                cwd=work_dir,
                timeout=120,
            )
            output = (result.stdout + result.stderr).strip()
            exit_code = result.returncode
            prefix = "OK" if exit_code == 0 else f"FAILED (exit {exit_code})"
            trimmed = output[:3000] if len(output) > 3000 else output
            return f"{prefix}:\n{trimmed}"
        except subprocess.TimeoutExpired:
            return "ERROR: Command timed out after 120 seconds"
        except Exception as e:
            return f"ERROR: {e}"


class SearchCodeTool(BaseTool):
    name: str = "search_code"
    description: str = (
        "Search for a pattern across TypeScript/TSX files in the project. "
        "Use to find existing implementations, imports, or usages."
    )
    args_schema: Type[BaseModel] = SearchCodeInput

    def _run(self, pattern: str, directory: str = ".") -> str:
        try:
            result = subprocess.run(
                ["grep", "-r", "-n", "--include=*.ts", "--include=*.tsx",
                 "--include=*.sql", "--include=*.py", pattern, directory],
                capture_output=True, text=True,
                cwd=PROJECT_ROOT, timeout=30,
            )
            out = result.stdout.strip()
            return out[:2000] if out else "No matches found"
        except Exception as e:
            return f"ERROR: {e}"


class ListFilesTool(BaseTool):
    name: str = "list_files"
    description: str = "List all files in a project directory (excludes node_modules and dist)."
    args_schema: Type[BaseModel] = ListFilesInput

    def _run(self, directory: str) -> str:
        target = PROJECT_ROOT / directory
        if not target.exists():
            return f"ERROR: Directory not found: {directory}"
        try:
            files = [
                str(p.relative_to(PROJECT_ROOT))
                for p in target.rglob("*")
                if p.is_file()
                and "node_modules" not in p.parts
                and "dist" not in p.parts
                and ".git" not in p.parts
            ]
            return "\n".join(sorted(files)[:100])
        except Exception as e:
            return f"ERROR: {e}"


# ── Named instances ────────────────────────────────────────────────────────────

read_file = ReadFileTool()
write_file = WriteFileTool()
run_command = RunCommandTool()
search_code = SearchCodeTool()
list_files = ListFilesTool()

CODE_TOOLS = [read_file, write_file, run_command, search_code, list_files]
READ_TOOLS = [read_file, run_command, search_code, list_files]
