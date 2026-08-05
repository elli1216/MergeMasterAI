import fnmatch
from dataclasses import dataclass


@dataclass(frozen=True)
class RoutingRule:
    file_pattern: str
    reviewer_role: str
    auto_approve: bool

ROUTING_RULES = [
    RoutingRule("schema.prisma", "Lead Backend Engineer", False),
    RoutingRule("*.prisma", "Lead Backend Engineer", False),
    RoutingRule("*.sql", "Database Engineer", False),
    RoutingRule("*.py", "Backend Engineer", False),
    RoutingRule("*.ts", "Backend Engineer", False),
    RoutingRule("*.tsx", "Frontend Engineer", False),
    RoutingRule("*.js", "Frontend Engineer", False),
    RoutingRule("*.css", "UI/UX Lead", True),
    RoutingRule("*.md", "Docs Reviewer", True),
    RoutingRule("*.txt", "Docs Reviewer", True),
]

DOC_EXTENSIONS = (".md", ".txt", ".rst")


def is_docs_file(filename: str) -> bool:
    name = filename.lower()
    if name.endswith(DOC_EXTENSIONS):
        return True
    if name.startswith("docs/") or "/docs/" in name:
        return True
    return any(token in name for token in ("readme", "changelog", "contributing"))


def route_files(files: list[str]) -> tuple[list[str], bool]:
    """Return (reviewer roles, docs_only) for the touched files."""
    reviewers: list[str] = []
    docs_only = bool(files)
    for filename in files:
        docs_only = docs_only and is_docs_file(filename)
        for rule in ROUTING_RULES:
            if fnmatch.fnmatch(filename, rule.file_pattern) and rule.reviewer_role not in reviewers:
                reviewers.append(rule.reviewer_role)
    if not reviewers:
        reviewers.append("Backend Engineer")
    return reviewers, docs_only
