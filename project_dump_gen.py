
from pathlib import Path
import csv

# ============================================================
# CONFIG
# ============================================================

PROJECT_ROOT = Path(r"C:\Users\ninad\Downloads\ZombieSurvival_Tauri")
OUTPUT_FILE = PROJECT_ROOT / "ZombieSurvival_project_dump.txt"

# Files/folders to skip
SKIP_DIRS = {
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    "node_modules",
    "target",
    "gen"
}

SKIP_FILES = {
    OUTPUT_FILE.name,
}


SKIP_EXTENSIONS = {
    ".py",
}

    
# Maximum CSV rows to include as a sample
CSV_SAMPLE_ROWS = 15


# ============================================================
# HELPERS
# ============================================================

def should_skip_dir(path: Path) -> bool:
    return path.name in SKIP_DIRS



def should_skip_file(path: Path) -> bool:
    return (
        path.name in SKIP_FILES
        or path.suffix.lower() in SKIP_EXTENSIONS
    )




def read_text_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        try:
            return path.read_text(encoding="utf-8-sig")
        except Exception:
            return f"[Could not decode file as UTF-8: {path.name}]"
    except Exception as e:
        return f"[Error reading file: {e}]"


def read_csv_sample(path: Path) -> str:
    """
    For CSV files:
    - If <= 15 rows: include everything.
    - If > 15 rows: include the first 15 rows and explicitly say it is a sample.
    """

    try:
        with path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.reader(f)
            rows = list(reader)

        total_rows = len(rows)

        if total_rows <= CSV_SAMPLE_ROWS:
            output = []
            for row in rows:
                output.append(",".join(row))

            return "\n".join(output)

        sample = rows[:CSV_SAMPLE_ROWS]

        output = [
            f"[CSV SAMPLE ONLY: showing first {CSV_SAMPLE_ROWS} rows "
            f"out of {total_rows} total rows]",
            ""
        ]

        for row in sample:
            output.append(",".join(row))

        output.extend([
            "",
            f"[END CSV SAMPLE: {total_rows} total rows exist in this file]"
        ])

        return "\n".join(output)

    except Exception as e:
        return f"[Error reading CSV: {e}]"


def get_relative_path(path: Path) -> str:
    return str(path.relative_to(PROJECT_ROOT))


# ============================================================
# BUILD DIRECTORY TREE
# ============================================================

def build_tree(root: Path) -> str:
    lines = []

    def walk(current: Path, prefix=""):
        try:
            entries = sorted(
                current.iterdir(),
                key=lambda p: (p.is_file(), p.name.lower())
            )
        except PermissionError:
            lines.append(prefix + "[Permission Denied]")
            return

        entries = [
            p for p in entries
            if not should_skip_dir(p) and not should_skip_file(p)
        ]

        for index, entry in enumerate(entries):
            is_last = index == len(entries) - 1
            connector = "└── " if is_last else "├── "

            lines.append(prefix + connector + entry.name)

            if entry.is_dir():
                extension = "    " if is_last else "│   "
                walk(entry, prefix + extension)

    lines.append(PROJECT_ROOT.name)
    walk(root)

    return "\n".join(lines)


# ============================================================
# COLLECT FILES
# ============================================================

def collect_files(root: Path):
    files = []

    for path in root.rglob("*"):
        if not path.is_file():
            continue

        if any(should_skip_dir(parent) for parent in path.parents):
            continue

        if should_skip_file(path):
            continue

        files.append(path)

    return sorted(files, key=lambda p: str(p).lower())


# ============================================================
# GENERATE DUMP
# ============================================================

def generate_dump():
    print("=" * 70)
    print("ZombieSurvival Project Dump Generator")
    print("=" * 70)

    if not PROJECT_ROOT.exists():
        print()
        print(f"ERROR: Project folder does not exist:")
        print(PROJECT_ROOT)
        return

    print()
    print(f"Project root : {PROJECT_ROOT}")
    print(f"Output file  : {OUTPUT_FILE}")
    print()

    tree = build_tree(PROJECT_ROOT)
    files = collect_files(PROJECT_ROOT)

    dump_parts = []

    # --------------------------------------------------------
    # HEADER
    # --------------------------------------------------------

    dump_parts.append(
        "=" * 80
        + "\n"
        + "ZOMBIESURVIVAL PROJECT DUMP"
        + "\n"
        + "=" * 80
        + "\n\n"
        + f"Project Root: {PROJECT_ROOT}\n"
        + f"Total Files Included: {len(files)}\n"
        + "\n"
    )

    # --------------------------------------------------------
    # DIRECTORY TREE
    # --------------------------------------------------------

    dump_parts.append(
        "=" * 80
        + "\n"
        + "PROJECT STRUCTURE"
        + "\n"
        + "=" * 80
        + "\n\n"
        + tree
        + "\n\n"
    )

    # --------------------------------------------------------
    # FILE CONTENTS
    # --------------------------------------------------------

    dump_parts.append(
        "=" * 80
        + "\n"
        + "FILE CONTENTS"
        + "\n"
        + "=" * 80
        + "\n\n"
    )

    for number, path in enumerate(files, start=1):

        relative = get_relative_path(path)

        dump_parts.append(
            "\n"
            + "#" * 80
            + "\n"
            + f"FILE {number}/{len(files)}: {relative}"
            + "\n"
            + "#" * 80
            + "\n\n"
        )

        # CSV handling
        if path.suffix.lower() == ".csv":
            content = read_csv_sample(path)

            dump_parts.append(
                "[CSV FILE]\n"
                + content
                + "\n"
            )

            continue

        # Text-based files
        text_extensions = {
            ".html",
            ".htm",
            ".css",
            ".js",
            ".mjs",
            ".cjs",
            ".json",
            ".py",
            ".txt",
            ".md",
            ".xml",
            ".svg",
            ".yaml",
            ".yml",
            ".ini",
            ".toml",
            ".bat",
            ".cmd",
            ".ps1",
            ".sql",
            ".glsl",
            ".gd",
        }

        if path.suffix.lower() in text_extensions:
            content = read_text_file(path)

            dump_parts.append(
                content
                + "\n"
            )

        else:
            # Don't dump binary files such as PNGs.
            try:
                size = path.stat().st_size
            except Exception:
                size = "unknown"

            dump_parts.append(
                f"[BINARY / NON-TEXT FILE]\n"
                f"File: {relative}\n"
                f"Size: {size} bytes\n"
                f"Content not included in dump.\n"
            )

    # --------------------------------------------------------
    # WRITE OUTPUT
    # --------------------------------------------------------

    final_dump = "".join(dump_parts)

    OUTPUT_FILE.write_text(
        final_dump,
        encoding="utf-8"
    )

    print("=" * 70)
    print("DONE")
    print("=" * 70)
    print()
    print(f"Files included : {len(files)}")
    print(f"Dump created   : {OUTPUT_FILE}")
    print()
    print("CSV files with more than 15 rows are explicitly marked")
    print("as SAMPLE and contain only their first 15 rows.")
    print()
    print("Binary files such as PNGs are listed but their binary")
    print("contents are not included.")
    print()


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    generate_dump()

