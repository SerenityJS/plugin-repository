// src/pages/PluginDetails.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import "../styles/layout.css";
import "./plugins.css";
import "./plugin-details.css";

import type { Plugin } from "../types";

/* -------- types -------- */
type GitHubRepo = {
  id: number;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  license?: { key: string; name: string } | null;
  topics?: string[];
  language?: string | null;
  homepage?: string | null;
  html_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: { login: string; avatar_url: string; html_url: string };
};

type GitHubRelease = {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  assets: Array<{
    id: number;
    name: string;
    browser_download_url: string;
    download_count: number;
    size: number;
    updated_at: string;
  }>;
};

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: { name: string; date: string };
  };
  author?: { login: string; avatar_url: string };
};

type GitHubContributor = {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
};

type LocationState = { plugin?: Plugin };

/* -------- utils -------- */
const decodeBase64Utf8 = (b64: string) => {
  const clean = b64.replace(/\r?\n/g, "");
  const bin = atob(clean);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const formatCount = (n: number) => {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${+(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}k`;
  if (n < 1_000_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  return `${+(n / 1_000_000_000).toFixed(1)}B`;
};
const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";
const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  const k = 1024, sizes = ["KB","MB","GB"];
  let i = -1, val = n;
  do { val /= k; i++; } while (val >= k && i < sizes.length - 1);
  return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${sizes[i]}`;
};

/* Optional auth header to avoid GH rate limits in dev */
const GH_HEADERS: HeadersInit = {};
// e.g. GH_HEADERS.Authorization = `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`;

/* simple in-memory caches */
const repoCache = new Map<string, GitHubRepo>();
const readmeCache = new Map<string, string>();
const releasesCache = new Map<string, GitHubRelease[]>();
const commitsCache = new Map<string, GitHubCommit[]>();
const contributorsCache = new Map<string, GitHubContributor[]>();
const latestReleaseCache = new Map<string, GitHubRelease | null>();

/* keyword colors (same palette you used on the list page) */
const KEYWORD_COLORS = ["#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#60a5fa", "#f87171", "#22d3ee"];

export default function PluginDetails() {
  const { owner = "", name = "" } = useParams<{ owner: string; name: string }>();
  const { state } = useLocation();
  const fromState = (state as LocationState | null)?.plugin;
  const cacheKey = `${owner}/${name}`;

  /* tabs: readme | versions | changelog */
  const [tab, setTab] = useState<"readme" | "versions" | "changelog">("readme");

  /* repo state */
  const [repo, setRepo] = useState<GitHubRepo | null>(() => repoCache.get(cacheKey) ?? null);
  const [, setRepoLoading] = useState<boolean>(!repo);
  const [, setRepoError] = useState<string | null>(null);

  /* readme state */
  const [readme, setReadme] = useState<string | null>(() => readmeCache.get(cacheKey) ?? null);
  const [readmeLoading, setReadmeLoading] = useState<boolean>(!readme);
  const [readmeError, setReadmeError] = useState<string | null>(null);

  /* releases state (tab list) */
  const [releases, setReleases] = useState<GitHubRelease[] | null>(() => releasesCache.get(cacheKey) ?? null);
  const [releasesLoading, setReleasesLoading] = useState<boolean>(false);
  const [releasesError, setReleasesError] = useState<string | null>(null);

  /* commits state (tab list) */
  const [commits, setCommits] = useState<GitHubCommit[] | null>(() => commitsCache.get(cacheKey) ?? null);
  const [commitsLoading, setCommitsLoading] = useState<boolean>(false);
  const [commitsError, setCommitsError] = useState<string | null>(null);

  /* sidebar: contributors */
  const [contributors, setContributors] = useState<GitHubContributor[] | null>(() => contributorsCache.get(cacheKey) ?? null);
  const [contributorsLoading, setContributorsLoading] = useState<boolean>(!contributors);
  const [contributorsError, setContributorsError] = useState<string | null>(null);

  /* sidebar: latest release */
  const [latestRelease, setLatestRelease] = useState<GitHubRelease | null>(() => latestReleaseCache.get(cacheKey) ?? null);
  const [latestLoading, setLatestLoading] = useState<boolean>(!latestRelease);
  const [latestError, setLatestError] = useState<string | null>(null);

  /* -------- fetch repo -------- */
  useEffect(() => {
    let alive = true;
    if (repo) return; // cached
    (async () => {
      try {
        setRepoLoading(true);
        setRepoError(null);
        const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, { headers: GH_HEADERS });
        if (!res.ok) throw new Error(`GitHub error: ${res.status} ${res.statusText}`);
        const data: GitHubRepo = await res.json();
        if (!alive) return;
        repoCache.set(cacheKey, data);
        setRepo(data);
      } catch (e: unknown) {
        if (!alive) return;
        setRepoError((e as Error)?.message ?? "Failed to fetch repository info.");
      } finally {
        if (alive) setRepoLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [cacheKey, name, owner, repo]);

  /* -------- fetch README (lazy: when tab === 'readme') -------- */
  useEffect(() => {
    if (tab !== "readme") return;
    let alive = true;
    if (readme !== null) return; // cached (could be "")
    (async () => {
      try {
        setReadmeLoading(true);
        setReadmeError(null);
        const res = await fetch(`https://api.github.com/repos/${owner}/${name}/readme`, { headers: GH_HEADERS });
        if (res.status === 404) {
          if (!alive) return;
          readmeCache.set(cacheKey, "");
          setReadme("");
          return;
        }
        if (!res.ok) throw new Error(`Failed to load README: ${res.status} ${res.statusText}`);

        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const json = await res.json();
          if (json?.content && json?.encoding === "base64") {
            const md = decodeBase64Utf8(json.content);
            if (!alive) return;
            readmeCache.set(cacheKey, md);
            setReadme(md);
          } else if (json?.download_url) {
            const raw = await fetch(json.download_url).then((r) => r.text());
            if (!alive) return;
            readmeCache.set(cacheKey, raw);
            setReadme(raw);
          } else throw new Error("Unexpected README response format.");
        } else {
          const md = await res.text();
          if (!alive) return;
          readmeCache.set(cacheKey, md);
          setReadme(md);
        }
      } catch (e: unknown) {
        if (!alive) return;
        setReadmeError((e as Error)?.message ?? "Failed to load README.");
      } finally {
        if (alive) setReadmeLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [cacheKey, name, owner, readme, tab]);

  /* -------- fetch releases (lazy: when tab === 'versions') -------- */
  useEffect(() => {
    if (tab !== "versions") return;
    let alive = true;
    if (releases) return; // cached
    (async () => {
      try {
        setReleasesLoading(true);
        setReleasesError(null);
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${name}/releases?per_page=25`,
          { headers: GH_HEADERS }
        );
        if (!res.ok) throw new Error(`Failed to load releases: ${res.status} ${res.statusText}`);
        const data: GitHubRelease[] = await res.json();
        if (!alive) return;
        releasesCache.set(cacheKey, data);
        setReleases(data);
      } catch (e: unknown) {
        if (!alive) return;
        setReleasesError((e as Error)?.message ?? "Failed to load releases.");
      } finally {
        if (alive) setReleasesLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [cacheKey, name, owner, releases, tab]);

  /* -------- fetch commits (lazy: when tab === 'changelog') -------- */
  useEffect(() => {
    if (tab !== "changelog") return;
    let alive = true;
    if (commits) return; // cached
    const branch = repo?.default_branch || "HEAD";
    (async () => {
      try {
        setCommitsLoading(true);
        setCommitsError(null);
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${name}/commits?per_page=50&sha=${encodeURIComponent(branch)}`,
          { headers: GH_HEADERS }
        );
        if (!res.ok) throw new Error(`Failed to load commits: ${res.status} ${res.statusText}`);
        const data: GitHubCommit[] = await res.json();
        if (!alive) return;
        commitsCache.set(cacheKey, data);
        setCommits(data);
      } catch (e: unknown) {
        if (!alive) return;
        setCommitsError((e as Error)?.message ?? "Failed to load commits.");
      } finally {
        if (alive) setCommitsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [cacheKey, commits, name, owner, repo?.default_branch, tab]);

  /* -------- sidebar: fetch latest release (eager) -------- */
  useEffect(() => {
    let alive = true;
    if (latestReleaseCache.has(cacheKey)) {
      setLatestRelease(latestReleaseCache.get(cacheKey) ?? null);
      setLatestLoading(false);
      return;
    }
    (async () => {
      try {
        setLatestLoading(true);
        setLatestError(null);
        const res = await fetch(`https://api.github.com/repos/${owner}/${name}/releases/latest`, { headers: GH_HEADERS });
        if (res.status === 404) {
          const res2 = await fetch(`https://api.github.com/repos/${owner}/${name}/releases?per_page=1`, { headers: GH_HEADERS });
          if (!res2.ok) throw new Error(`Failed to load releases: ${res2.status} ${res2.statusText}`);
          const arr: GitHubRelease[] = await res2.json();
          const r = arr.find((x) => !x.draft) ?? null;
          if (!alive) return;
          latestReleaseCache.set(cacheKey, r ?? null);
          setLatestRelease(r ?? null);
          return;
        }
        if (!res.ok) throw new Error(`Failed to load latest release: ${res.status} ${res.statusText}`);
        const data: GitHubRelease = await res.json();
        if (!alive) return;
        latestReleaseCache.set(cacheKey, data);
        setLatestRelease(data);
      } catch (e: unknown) {
        if (!alive) return;
        setLatestError((e as Error)?.message ?? "Failed to load latest release.");
      } finally {
        if (alive) setLatestLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [cacheKey, name, owner]);

  /* -------- sidebar: fetch contributors (eager) -------- */
  useEffect(() => {
    let alive = true;
    if (contributorsCache.has(cacheKey)) {
      setContributors(contributorsCache.get(cacheKey) ?? null);
      setContributorsLoading(false);
      return;
    }
    (async () => {
      try {
        setContributorsLoading(true);
        setContributorsError(null);
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${name}/contributors?per_page=30`,
          { headers: GH_HEADERS }
        );
        if (res.status === 204) {
          if (!alive) return;
          contributorsCache.set(cacheKey, []);
          setContributors([]);
          return;
        }
        if (!res.ok) throw new Error(`Failed to load contributors: ${res.status} ${res.statusText}`);
        const data: GitHubContributor[] = await res.json();
        if (!alive) return;
        contributorsCache.set(cacheKey, data);
        setContributors(data);
      } catch (e: unknown) {
        if (!alive) return;
        setContributorsError((e as Error)?.message ?? "Failed to load contributors.");
      } finally {
        if (alive) setContributorsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [cacheKey, name, owner]);

  /* -------- resolve relative links/images in README -------- */
  const defaultBranch = repo?.default_branch || "HEAD";
  const rawBase = useMemo(
    () => `https://raw.githubusercontent.com/${owner}/${name}/${defaultBranch}`,
    [defaultBranch, name, owner]
  );
  const resolveUrl = (url?: string) => {
    if (!url) return "";
    if (/^(?:https?:)?\/\//i.test(url) || url.startsWith("#")) return url;
    return `${rawBase}/${url.replace(/^\.?\//, "")}`;
  };

  /* -------- derived display values -------- */
  const displayTitle = repo?.full_name ?? (fromState ? `${fromState.owner}/${fromState.name}` : `${owner}/${name}`);
  const displayDesc = repo?.description ?? fromState?.description ?? "";
  const repoUrl = repo?.html_url ?? (fromState ? `https://github.com/${fromState.owner}/${fromState.name}` : `https://github.com/${owner}/${name}`);
  const homepage = repo?.homepage?.trim() ? repo.homepage : undefined;

  /* ------- keywords: prefer plugin.keywords, fallback to repo topics ------- */
  const keywords = useMemo<string[]>(
    () => (fromState?.keywords?.length ? fromState.keywords : (repo?.topics ?? [])),
    [fromState?.keywords, repo?.topics]
  );

  return (
    <section className="plugins-page plugin-details">
      <div className="page-container">
        <header className="page-header">
          <h1>{displayTitle}</h1>
          {displayDesc && <p className="subtitle">{displayDesc}</p>}
        </header>

        <div className="details-card" style={{ marginBottom: "1rem" }}>
          <div className="details-hero">
            <img
              src={fromState?.logo ?? "https://avatars.githubusercontent.com/u/92610726?s=88&v=4"}
              alt={`${name} logo`}
              className="details-logo"
              tabIndex={0}
            />
            <div>
              <h2 className="details-title" style={{ marginBottom: ".25rem" }}>
                {displayTitle}
              </h2>
              <div className="aside-stats">
                <a
                  className="chip link"
                  href={`https://github.com/${owner}/${name}/stargazers`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${formatCount(repo?.stargazers_count ?? fromState?.stars ?? 0)} stargazers`}
                  title="View stargazers"
                >
                  ⭐ {formatCount(repo?.stargazers_count ?? fromState?.stars ?? 0)} stars
                </a>
                <a
                  className="chip link"
                  href={`https://github.com/${owner}/${name}/network/members`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${formatCount(repo?.forks_count ?? 0)} forks`}
                  title="View forks"
                >
                  🍴 {formatCount(repo?.forks_count ?? 0)} forks
                </a>
                <a
                  className="chip link"
                  href={`https://github.com/${owner}/${name}/issues`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${formatCount(repo?.open_issues_count ?? 0)} issues`}
                  title="View issues"
                >
                  🐛 {formatCount(repo?.open_issues_count ?? 0)} issues
                </a>
              </div>
            </div>
          </div>

          {/* Actions + Tabs row */}
          <div className="details-actions">
            {/* Left: Homepage (keep), then keywords instead of View Source + Updated */}
            <div className="details-actions-left">
              {homepage && (
                <a className="badge link" href={homepage} target="_blank" rel="noreferrer">Homepage</a>
              )}
              {keywords.length > 0 && (
                <div className="keyword-list details-keywords">
                  {keywords.map((kw, i) => {
                    const color = KEYWORD_COLORS[i % KEYWORD_COLORS.length];
                    return (
                      <span
                        key={`kw-${kw}-${i}`}
                        className="keyword-chip"
                        style={{ borderColor: color, color }}
                        title={kw}
                      >
                        {kw}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="tabbar" role="tablist" aria-label="Repository content">
              <button
                role="tab"
                aria-selected={tab === "readme"}
                className={`tab ${tab === "readme" ? "active" : ""}`}
                onClick={() => setTab("readme")}
              >
                README
              </button>
              <button
                role="tab"
                aria-selected={tab === "versions"}
                className={`tab ${tab === "versions" ? "active" : ""}`}
                onClick={() => setTab("versions")}
              >
                Versions
              </button>
              <button
                role="tab"
                aria-selected={tab === "changelog"}
                className={`tab ${tab === "changelog" ? "active" : ""}`}
                onClick={() => setTab("changelog")}
              >
                Changelog
              </button>
            </div>
          </div>
        </div>

        {/* Main + Sidebar */}
        <div className="details-grid">
          {/* Main column: tab panels */}
          <main className="details-main">
            {tab === "readme" && (
              <div className="modal-section" role="tabpanel" aria-label="README">
                <h3 className="section-title">README</h3>
                {readmeLoading && (
                  <div className="modal-loading">
                    <span className="spinner" aria-hidden="true"></span>
                    <span>Loading README…</span>
                  </div>
                )}
                {readmeError && !readmeLoading && (
                  <div className="modal-error" role="alert">{readmeError}</div>
                )}
                {!readmeLoading && !readmeError && readme === "" && (
                  <p className="section-text" style={{ opacity: 0.85 }}>No README found for this repository.</p>
                )}
                {!readmeLoading && !readmeError && readme && (
                  <article className="markdown-body">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        img: ({ src, alt }) => <img src={resolveUrl(src as string)} alt={(alt as string) || ""} />,
                        a: ({ href, children, ...props }) => (
                          <a href={resolveUrl(href as string)} target="_blank" rel="noreferrer" {...props}>{children}</a>
                        ),
                      }}
                    >
                      {readme}
                    </ReactMarkdown>
                  </article>
                )}
              </div>
            )}

            {tab === "versions" && (
              <div className="modal-section" role="tabpanel" aria-label="Versions">
                <h3 className="section-title">Releases</h3>
                {releasesLoading && (
                  <div className="modal-loading">
                    <span className="spinner" aria-hidden="true"></span>
                    <span>Loading releases…</span>
                  </div>
                )}
                {releasesError && !releasesLoading && (
                  <div className="modal-error" role="alert">{releasesError}</div>
                )}
                {!releasesLoading && !releasesError && (releases?.length ?? 0) === 0 && (
                  <p className="section-text" style={{ opacity: 0.85 }}>No releases found.</p>
                )}
                {!!releases?.length && (
                  <ul className="release-list">
                    {releases.map((r) => (
                      <li key={r.id} className="release-item">
                        <div className="release-head">
                          <div className="release-titles">
                            <a className="release-name" href={r.html_url} target="_blank" rel="noreferrer">
                              {r.name || r.tag_name}
                            </a>
                            <span className={`release-tag ${r.prerelease ? "pre" : ""}`}>{r.tag_name}{r.prerelease ? " (pre-release)" : ""}</span>
                          </div>
                          <div className="release-meta">
                            {r.published_at ? `Published ${formatDate(r.published_at)}` : r.draft ? "Draft" : ""}
                          </div>
                        </div>

                        {r.body && (
                          <div className="release-body markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {r.body}
                            </ReactMarkdown>
                          </div>
                        )}

                        {r.assets?.length > 0 && (
                          <div className="assets">
                            {r.assets.map((a) => (
                              <a
                                key={a.id}
                                className="asset-chip"
                                href={a.browser_download_url}
                                target="_blank"
                                rel="noreferrer"
                                title={`${a.name} • ${formatBytes(a.size)} • ${a.download_count.toLocaleString()} downloads`}
                              >
                                ⬇ {a.name} · {formatBytes(a.size)} · {a.download_count.toLocaleString()}
                              </a>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === "changelog" && (
              <div className="modal-section" role="tabpanel" aria-label="Changelog">
                <h3 className="section-title">Recent Commits</h3>
                {commitsLoading && (
                  <div className="modal-loading">
                    <span className="spinner" aria-hidden="true"></span>
                    <span>Loading commits…</span>
                  </div>
                )}
                {commitsError && !commitsLoading && (
                  <div className="modal-error" role="alert">{commitsError}</div>
                )}
                {!!commits?.length && (
                  <ul className="commit-list">
                    {commits.map((c) => {
                      const firstLine = c.commit.message.split("\n")[0];
                      const when = c.commit.author?.date ? formatDate(c.commit.author.date) : "";
                      return (
                        <li key={c.sha} className="commit-item">
                          <a className="commit-msg" href={c.html_url} target="_blank" rel="noreferrer">
                            {firstLine}
                          </a>
                          <div className="commit-meta">
                            {c.author?.login ? <span>@{c.author.login}</span> : null}
                            {when && <span>• {when}</span>}
                            <span className="sha">{c.sha.substring(0, 7)}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!commitsLoading && !commitsError && (commits?.length ?? 0) === 0 && (
                  <p className="section-text" style={{ opacity: 0.85 }}>No commits found.</p>
                )}
              </div>
            )}

            <div style={{ marginTop: "1rem" }}>
              <Link to="/plugins" className="btn-link">← Back to all plugins</Link>
            </div>
          </main>

          {/* Sidebar column */}
          <aside className="details-sidebar">
            {/* Purple CTA */}
            <div className="side-card">
              <a className="btn primary block" href={repoUrl} target="_blank" rel="noreferrer">
                View on GitHub
              </a>
            </div>

            {/* Latest release */}
            <div className="side-card">
              <h4 className="side-title">Latest Release</h4>
              {latestLoading && (
                <div className="modal-loading"><span className="spinner" /> <span>Loading…</span></div>
              )}
              {latestError && !latestLoading && (
                <div className="modal-error" role="alert">{latestError}</div>
              )}
              {!latestLoading && !latestError && !latestRelease && (
                <p className="side-text" style={{ opacity: .85 }}>No releases yet.</p>
              )}
              {latestRelease && (
                <>
                  <div className="latest-row">
                    <a className="latest-name" href={latestRelease.html_url} target="_blank" rel="noreferrer">
                      {latestRelease.name || latestRelease.tag_name}
                    </a>
                    <span className={`release-tag ${latestRelease.prerelease ? "pre" : ""}`}>
                      {latestRelease.tag_name}{latestRelease.prerelease ? " (pre)" : ""}
                    </span>
                  </div>
                  <div className="latest-meta">{latestRelease.published_at ? `Published ${formatDate(latestRelease.published_at)}` : "Unpublished"}</div>

                  {latestRelease.assets?.length > 0 && (
                    <div className="assets">
                      {latestRelease.assets.slice(0, 3).map((a) => (
                        <a
                          key={a.id}
                          className="asset-chip"
                          href={a.browser_download_url}
                          target="_blank"
                          rel="noreferrer"
                          title={`${a.name} • ${formatBytes(a.size)} • ${a.download_count.toLocaleString()} downloads`}
                        >
                          ⬇ {a.name} · {formatBytes(a.size)}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Contributors */}
            <div className="side-card">
              <h4 className="side-title">Contributors</h4>
              {contributorsLoading && (
                <div className="modal-loading"><span className="spinner" /> <span>Loading…</span></div>
              )}
              {contributorsError && !contributorsLoading && (
                <div className="modal-error" role="alert">{contributorsError}</div>
              )}
              {!contributorsLoading && !contributorsError && (contributors?.length ?? 0) === 0 && (
                <p className="side-text" style={{ opacity: .85 }}>No contributors yet.</p>
              )}
              {!!contributors?.length && (
                <div className="contrib-grid">
                  {contributors.slice(0, 24).map((c) => (
                    <a
                      key={c.login}
                      className="contrib"
                      href={c.html_url}
                      target="_blank"
                      rel="noreferrer"
                      title={`${c.login} • ${c.contributions} contribution${c.contributions === 1 ? "" : "s"}`}
                      aria-label={`${c.login} (${c.contributions} contributions)`}
                    >
                      <img src={c.avatar_url} alt={c.login} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
