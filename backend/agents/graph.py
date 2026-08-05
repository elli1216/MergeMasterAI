from langgraph.graph import END, START, StateGraph

from agents.nodes import (
    analyze_changes,
    committer_agent,
    enforce_gate,
    extract_diff,
    record_result,
    route_reviewers,
)
from agents.state import PipelineState

_GRAPH = None


def build_graph():
    graph = StateGraph(PipelineState)
    graph.add_node("extract_diff", extract_diff)
    graph.add_node("analyze_changes", analyze_changes)
    graph.add_node("route_reviewers", route_reviewers)
    graph.add_node("committer_agent", committer_agent)
    graph.add_node("enforce_gate", enforce_gate)
    graph.add_node("record_result", record_result)

    graph.add_edge(START, "extract_diff")
    graph.add_conditional_edges(
        "extract_diff",
        lambda state: "fail" if state.get("error") else "continue",
        {"continue": "analyze_changes", "fail": END},
    )
    graph.add_edge("analyze_changes", "route_reviewers")
    graph.add_conditional_edges(
        "route_reviewers",
        lambda state: "remediate" if state.get("status") == "blocked" else "gate",
        {"remediate": "committer_agent", "gate": "enforce_gate"},
    )
    graph.add_edge("committer_agent", "enforce_gate")
    graph.add_edge("enforce_gate", "record_result")
    graph.add_edge("record_result", END)
    return graph.compile()


def get_graph():
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = build_graph()
    return _GRAPH


async def run_pipeline(
    *,
    repo_name: str,
    pr_number: int,
    title: str = "",
    author: str = "",
    github_token: str | None = None,
) -> dict:
    return await get_graph().ainvoke(
        {
            "repo_name": repo_name,
            "pr_number": pr_number,
            "title": title,
            "author": author,
            "github_token": github_token,
        }
    )