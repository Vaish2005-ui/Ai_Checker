"""
github_analyzer.py — GitHub Repository Analyzer
=================================================
Fetches real data from the GitHub public API and derives
DORA-like software engineering metrics for the risk model.

Supports both user accounts and organization accounts.
Uses unauthenticated API (60 req/hr) by default;
set GITHUB_TOKEN env var for 5000 req/hr.
"""

import os
import logging
import requests
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger("github_analyzer")

GITHUB_API = "https://api.github.com"


def _headers() -> dict:
    """Build request headers, including auth token if available."""
    h = {"Accept": "application/vnd.github.v3+json"}
    token = os.getenv("GITHUB_TOKEN")
    if token:
        h["Authorization"] = f"token {token}"
    return h


def _get(url: str, params: dict = None) -> Any:
    """Make a GET request to GitHub API with error handling."""
    try:
        resp = requests.get(url, headers=_headers(), params=params or {}, timeout=15)
        if resp.status_code == 403:
            logger.warning("GitHub API rate limit hit")
            return None
        if resp.status_code == 404:
            logger.warning("GitHub resource not found: %s", url)
            return None
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        logger.error("GitHub API error: %s", e)
        return None


def fetch_user_repos(username: str, max_repos: int = 10) -> List[dict]:
    """Fetch top repositories for a user/org, sorted by recent push."""
    # Try as user first
    data = _get(f"{GITHUB_API}/users/{username}/repos", {
        "sort": "pushed",
        "direction": "desc",
        "per_page": max_repos,
        "type": "owner",
    })
    if data is None:
        # Try as organization
        data = _get(f"{GITHUB_API}/orgs/{username}/repos", {
            "sort": "pushed",
            "direction": "desc",
            "per_page": max_repos,
        })
    return data or []


def fetch_recent_commits(owner: str, repo: str, days: int = 30) -> List[dict]:
    """Fetch commits from the last N days."""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    data = _get(f"{GITHUB_API}/repos/{owner}/{repo}/commits", {
        "since": since,
        "per_page": 100,
    })
    return data or []


def fetch_pulls(owner: str, repo: str, state: str = "all", days: int = 30) -> List[dict]:
    """Fetch pull requests from the last N days."""
    data = _get(f"{GITHUB_API}/repos/{owner}/{repo}/pulls", {
        "state": state,
        "sort": "updated",
        "direction": "desc",
        "per_page": 100,
    })
    if not data:
        return []
    # Filter to recent ones
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    recent = []
    for pr in data:
        created = datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00"))
        if created >= cutoff:
            recent.append(pr)
    return recent


def fetch_issues(owner: str, repo: str, days: int = 30) -> List[dict]:
    """Fetch issues (excluding PRs) from the last N days."""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    data = _get(f"{GITHUB_API}/repos/{owner}/{repo}/issues", {
        "state": "all",
        "since": since,
        "per_page": 100,
    })
    if not data:
        return []
    # Filter out pull requests (GitHub includes PRs in issues endpoint)
    return [i for i in data if "pull_request" not in i]


def fetch_releases(owner: str, repo: str) -> List[dict]:
    """Fetch recent releases/tags."""
    data = _get(f"{GITHUB_API}/repos/{owner}/{repo}/releases", {
        "per_page": 30,
    })
    return data or []


def analyze_github_account(username: str) -> Dict[str, Any]:
    """
    Main analysis function. Fetches data from GitHub and derives
    DORA-like metrics + code health indicators.
    
    Returns a dict with:
    - dora: {deployment_frequency, lead_time_days, mttr_hours, change_failure_rate}
    - github_activity: {commits_per_week, prs_per_week, ...}
    - code_health, tech_debt_score, security_risk_score
    - repo_details: per-repo breakdown
    - raw_stats: aggregate numbers
    """
    logger.info("Analyzing GitHub account: %s", username)
    
    # ── Step 1: Fetch repositories ────────────────────────────────────────
    repos = fetch_user_repos(username, max_repos=10)
    if not repos:
        logger.warning("No repos found for %s", username)
        return {"error": f"No public repositories found for '{username}'"}
    
    # ── Step 2: Aggregate data across repos ───────────────────────────────
    total_commits_30d = 0
    total_prs_30d = 0
    total_prs_merged = 0
    total_prs_closed_not_merged = 0
    total_issues_30d = 0
    total_issues_closed = 0
    total_issues_open = 0
    total_bug_issues = 0
    total_releases_30d = 0
    pr_merge_times_hours = []
    issue_resolve_times_hours = []
    repo_details = []
    total_stars = 0
    total_forks = 0
    languages = {}
    
    cutoff_30d = datetime.now(timezone.utc) - timedelta(days=30)
    
    for repo in repos[:8]:  # Limit to 8 repos to stay within rate limits
        owner = repo["owner"]["login"]
        name = repo["name"]
        
        # Skip forks if desired
        if repo.get("fork", False):
            continue
            
        total_stars += repo.get("stargazers_count", 0)
        total_forks += repo.get("forks_count", 0)
        
        lang = repo.get("language")
        if lang:
            languages[lang] = languages.get(lang, 0) + 1
        
        # Commits
        commits = fetch_recent_commits(owner, name, days=30)
        repo_commits = len(commits)
        total_commits_30d += repo_commits
        
        # Pull Requests
        pulls = fetch_pulls(owner, name, state="all", days=30)
        repo_prs = len(pulls)
        total_prs_30d += repo_prs
        
        for pr in pulls:
            if pr.get("merged_at"):
                total_prs_merged += 1
                created = datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00"))
                merged = datetime.fromisoformat(pr["merged_at"].replace("Z", "+00:00"))
                merge_time = (merged - created).total_seconds() / 3600
                pr_merge_times_hours.append(merge_time)
            elif pr.get("state") == "closed":
                total_prs_closed_not_merged += 1
        
        # Issues
        issues = fetch_issues(owner, name, days=30)
        repo_issues = len(issues)
        total_issues_30d += repo_issues
        
        for issue in issues:
            labels_lower = [l["name"].lower() for l in issue.get("labels", [])]
            if any(kw in lbl for lbl in labels_lower for kw in ["bug", "defect", "error", "fix"]):
                total_bug_issues += 1
            
            if issue.get("state") == "closed":
                total_issues_closed += 1
                created = datetime.fromisoformat(issue["created_at"].replace("Z", "+00:00"))
                closed = datetime.fromisoformat(issue["closed_at"].replace("Z", "+00:00"))
                resolve_time = (closed - created).total_seconds() / 3600
                issue_resolve_times_hours.append(resolve_time)
            else:
                total_issues_open += 1
        
        # Releases (proxy for deployments)
        releases = fetch_releases(owner, name)
        recent_releases = [r for r in releases if
                          datetime.fromisoformat(r["created_at"].replace("Z", "+00:00")) >= cutoff_30d]
        total_releases_30d += len(recent_releases)
        
        repo_details.append({
            "name": name,
            "language": lang,
            "stars": repo.get("stargazers_count", 0),
            "forks": repo.get("forks_count", 0),
            "commits_30d": repo_commits,
            "prs_30d": repo_prs,
            "issues_30d": repo_issues,
            "releases_30d": len(recent_releases),
            "open_issues": repo.get("open_issues_count", 0),
            "updated_at": repo.get("pushed_at", ""),
        })
    
    # ── Step 3: Derive DORA Metrics ───────────────────────────────────────
    
    # Deployment Frequency (releases + merged PRs per day as proxy)
    deploy_events = total_releases_30d + total_prs_merged
    deployment_frequency = round(deploy_events / 30, 2) if deploy_events > 0 else 0.05
    
    # Lead Time for Changes (avg PR merge time in days)
    if pr_merge_times_hours:
        avg_merge_hours = sum(pr_merge_times_hours) / len(pr_merge_times_hours)
        lead_time_days = round(avg_merge_hours / 24, 1)
    else:
        lead_time_days = 14.0  # default if no PR data
    
    # MTTR — Mean Time to Recovery (avg issue resolve time as proxy)
    if issue_resolve_times_hours:
        mttr_hours = round(sum(issue_resolve_times_hours) / len(issue_resolve_times_hours), 1)
    else:
        mttr_hours = 24.0  # default
    
    # Change Failure Rate (bug issues / total deploys, clamped 0-1)
    if deploy_events > 0:
        change_failure_rate = round(min(1.0, total_bug_issues / max(deploy_events, 1)), 3)
    else:
        change_failure_rate = 0.15  # default
    
    # ── Step 4: Derive Code Health Metrics ────────────────────────────────
    
    # Tech Debt Score (0-1): higher = more debt
    # Based on: open issues ratio, stale repos, PR rejection rate
    pr_rejection_rate = total_prs_closed_not_merged / max(total_prs_30d, 1)
    issue_backlog_ratio = total_issues_open / max(total_issues_30d, 1)
    tech_debt_score = round(min(1.0, (pr_rejection_rate * 0.3 + issue_backlog_ratio * 0.4 + change_failure_rate * 0.3)), 3)
    
    # Security Risk Score (0-1): based on open issues with security labels + tech debt
    security_risk_score = round(min(1.0, tech_debt_score * 0.5 + change_failure_rate * 0.3 + (1 - deployment_frequency) * 0.2), 3)
    
    # Code Health (0-100): composite health score
    code_health = max(0, min(100, 100 - tech_debt_score * 25 - security_risk_score * 20 - change_failure_rate * 30))
    
    # Commits per week and PRs per week
    commits_per_week = round(total_commits_30d / 4.3, 1)
    prs_per_week = round(total_prs_30d / 4.3, 1)
    
    # Average review time (use PR merge time as proxy for review)
    avg_review_time_hours = round(sum(pr_merge_times_hours) / max(len(pr_merge_times_hours), 1), 1) if pr_merge_times_hours else 24.0
    
    # Bug rate per 100 deploys
    bug_rate = round((total_bug_issues / max(deploy_events, 1)) * 100, 1)
    
    result = {
        "username": username,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
        "repo_count": len(repo_details),
        "dora": {
            "deployment_frequency": deployment_frequency,
            "lead_time_days": lead_time_days,
            "mttr_hours": mttr_hours,
            "change_failure_rate": round(change_failure_rate * 100, 1),  # as percentage
        },
        "github_activity": {
            "commits_per_week": round(commits_per_week),
            "prs_per_week": round(prs_per_week),
            "prs_merged_30d": total_prs_merged,
            "avg_review_time_hours": avg_review_time_hours,
            "bug_rate_per_100_deploys": bug_rate,
        },
        "code_health": round(code_health, 1),
        "tech_debt_score": round(tech_debt_score * 100, 1),
        "security_risk_score": round(security_risk_score * 100, 1),
        "raw_stats": {
            "total_commits_30d": total_commits_30d,
            "total_prs_30d": total_prs_30d,
            "total_issues_30d": total_issues_30d,
            "total_issues_open": total_issues_open,
            "total_issues_closed": total_issues_closed,
            "total_bug_issues": total_bug_issues,
            "total_releases_30d": total_releases_30d,
            "total_stars": total_stars,
            "total_forks": total_forks,
        },
        "languages": languages,
        "repo_details": repo_details,
        # Normalized metrics for the ML model (0-1 scale)
        "model_metrics": {
            "deployment_frequency": min(1.0, deployment_frequency),
            "lead_time_days": lead_time_days,
            "mttr_hours": mttr_hours,
            "change_failure_rate": change_failure_rate,
            "tech_debt": tech_debt_score,
            "security_risk": security_risk_score,
        },
        "sprint_velocity": max(1, int((1 - change_failure_rate) * 20)),
        "open_bugs": total_bug_issues + total_issues_open,
        "resolved_this_week": max(0, int(total_issues_closed / 4.3)),
    }
    
    logger.info("GitHub analysis complete for %s: %d repos, %d commits, %d PRs",
                username, len(repo_details), total_commits_30d, total_prs_30d)
    
    return result
