"""Compatibility entry point for versioned power-bank editorial maintenance.

The JSON dataset is authoritative. The renderer preserves the editorial shell
and covers. Run normal blog preparation/export before publication.
"""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]

if __name__ == "__main__":
    raise SystemExit(subprocess.call(
        ["node", str(ROOT / "scripts" / "prepare-power-bank-pseo.mjs")], cwd=ROOT
    ))
