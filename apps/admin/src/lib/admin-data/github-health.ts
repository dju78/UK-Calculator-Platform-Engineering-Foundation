import type { ExternalProviderStatus } from "./provider-types";

export type GitHubWorkflowConclusion =
  | "success"
  | "failure"
  | "in_progress"
  | "queued"
  | "cancelled"
  | "timed_out"
  | "action_required"
  | "unknown";

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  runNumber: number;
  event: string;
  status: string;
  conclusion: GitHubWorkflowConclusion;
  branch: string;
  commitSha: string;
  commitMessage?: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  durationFormatted: string;
  htmlUrl: string;
  actor: string;
}

export interface AdminGitHubHealthOverview {
  provider: "GitHub REST API";
  repository: string;
  status: ExternalProviderStatus;
  statusLabel: string;
  isLiveConnected: boolean;
  latestRun: GitHubWorkflowRun | null;
  recentRuns: GitHubWorkflowRun[];
  totalRunsRecorded: number;
  lastChecked: string;
  rateLimitRemaining?: number;
  notes: string;
}

const REPO_SLUG = "dju78/UK-Calculator-Platform-Engineering-Foundation";

export function formatDuration(seconds?: number): string {
  if (typeof seconds !== "number" || isNaN(seconds) || seconds < 0) {
    return "Not available";
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function mapGitHubRunsResponse(rawData: any): AdminGitHubHealthOverview {
  if (!rawData || typeof rawData !== "object" || !Array.isArray(rawData.workflow_runs)) {
    return buildEmptyGitHubHealthOverview("ERROR", "Invalid GitHub Actions API response");
  }

  const runs: GitHubWorkflowRun[] = rawData.workflow_runs.slice(0, 10).map((r: any) => {
    const started = r.run_started_at || r.created_at || new Date().toISOString();
    const updated = r.updated_at || started;
    let durationSeconds: number | undefined;

    if (r.run_started_at && r.updated_at) {
      const diffMs = new Date(r.updated_at).getTime() - new Date(r.run_started_at).getTime();
      if (diffMs >= 0) {
        durationSeconds = Math.round(diffMs / 1000);
      }
    }

    let conclusion: GitHubWorkflowConclusion = "unknown";
    if (r.status === "in_progress") conclusion = "in_progress";
    else if (r.status === "queued") conclusion = "queued";
    else if (r.conclusion === "success") conclusion = "success";
    else if (r.conclusion === "failure") conclusion = "failure";
    else if (r.conclusion === "cancelled") conclusion = "cancelled";
    else if (r.conclusion === "timed_out") conclusion = "timed_out";

    return {
      id: r.id,
      name: r.name || "CI Workflow",
      runNumber: r.run_number || 0,
      event: r.event || "push",
      status: r.status || "completed",
      conclusion,
      branch: r.head_branch || "main",
      commitSha: r.head_sha ? r.head_sha.slice(0, 7) : "Unknown",
      commitMessage: r.head_commit?.message?.split("\n")[0] || undefined,
      startedAt: started,
      completedAt: r.status === "completed" ? updated : undefined,
      durationSeconds,
      durationFormatted: formatDuration(durationSeconds),
      htmlUrl: r.html_url || `https://github.com/${REPO_SLUG}/actions`,
      actor: r.actor?.login || "github-actions",
    };
  });

  const latest = runs[0] || null;

  return {
    provider: "GitHub REST API",
    repository: REPO_SLUG,
    status: "CONNECTED",
    statusLabel: latest?.conclusion === "success" ? "CI Passing (GitHub Actions)" : "Live GitHub Data Connected",
    isLiveConnected: true,
    latestRun: latest,
    recentRuns: runs,
    totalRunsRecorded: rawData.total_count || runs.length,
    lastChecked: new Date().toISOString(),
    notes: "Official read-only CI status from GitHub Actions workflow runs API.",
  };
}

export function buildEmptyGitHubHealthOverview(
  status: ExternalProviderStatus = "NOT_CONFIGURED",
  statusLabel?: string
): AdminGitHubHealthOverview {
  return {
    provider: "GitHub REST API",
    repository: REPO_SLUG,
    status,
    statusLabel: statusLabel || "Live GitHub status unavailable",
    isLiveConnected: false,
    latestRun: null,
    recentRuns: [],
    totalRunsRecorded: 0,
    lastChecked: "Not available",
    notes: "Public repository workflow status available via GitHub Actions API. Set GITHUB_READ_TOKEN for higher rate limits.",
  };
}

export async function fetchLiveGitHubHealth(): Promise<AdminGitHubHealthOverview> {
  const token = process.env.GITHUB_READ_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim();

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "UKCalc-Admin-Console/0.2.0",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://api.github.com/repos/${REPO_SLUG}/actions/runs?per_page=10`, {
      headers,
      signal: controller.signal,
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return buildEmptyGitHubHealthOverview("UNAVAILABLE", `GitHub API returned HTTP ${res.status}`);
    }

    const json = await res.json();
    return mapGitHubRunsResponse(json);
  } catch {
    return buildEmptyGitHubHealthOverview("UNAVAILABLE", "GitHub Actions API temporarily unreachable");
  }
}

export function getAdminGitHubHealthOverview(): AdminGitHubHealthOverview {
  return buildEmptyGitHubHealthOverview("NOT_CONFIGURED", "Live GitHub Data (Read-Only)");
}
