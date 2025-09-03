// src/pages/PluginDetails.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { fetchPlugin } from "../functions/fetch-plugins";
import "../styles/layout.css";
import "./plugins.css";
import "./plugin-details.css";

import type { Plugin, PluginCommit } from "../types";
import {
  DownloadIcon,
  IssueReopenedIcon,
  RepoForkedIcon,
  StarFillIcon,
  FileMediaIcon,
  MarkGithubIcon,
  AlertIcon,
} from "@primer/octicons-react";
import { submitPluginReport } from "../functions/submit-report";

/* -------- types -------- */

type LocationState = { plugin?: Plugin };

/* -------- utils -------- */
const formatCount = (n: number) => {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${+(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}k`;
  if (n < 1_000_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  return `${+(n / 1_000_000_000).toFixed(1)}B`;
};
const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  const k = 1024,
    sizes = ["KB", "MB", "GB"];
  let i = -1,
    val = n;
  do {
    val /= k;
    i++;
  } while (val >= k && i < sizes.length - 1);
  return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${sizes[i]}`;
};

/* Media util functions for gallery */
const isMediaFile = (filename: string): boolean => {
  return /\.(jpe?g|png|gif|webp|svg|mp4|webm)$/i.test(filename);
};
const isVideoFile = (filename: string): boolean => {
  return /\.(mp4|webm)$/i.test(filename);
};

/* simple in-memory caches */
const pluginCache = new Map<string, Plugin>();

/* keyword colors */
const KEYWORD_COLORS = [
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
  "#f87171",
  "#22d3ee",
];

export default function PluginDetails() {
  const { owner = "", name = "" } = useParams<{
    owner: string;
    name: string;
  }>();
  const { state } = useLocation() as { state: LocationState };
  const fromState = (state as LocationState | null)?.plugin;
  const cacheKey = `${owner}/${name}`;
  const navigate = useNavigate();

  // Report values
  const [isInReporting, setIsInReporting] = useState(false);
  const [reportCategory, setReportCategory] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  /* tabs: readme | versions | changelog */
  const [tab, setTab] = useState<
    "readme" | "versions" | "changelog" | "gallery"
  >("readme");

  /* repo state */
  const [repo, setPlugin] = useState<Plugin | null>(
    () => pluginCache.get(cacheKey) ?? null
  );
  const [, setPluginLoading] = useState<boolean>(!repo);
  const [, setPluginError] = useState<string | null>(null);

  /* readme state */
  const [readme, setReadme] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState<boolean>(true);
  const [readmeError, setReadmeError] = useState<string | null>(null);

  /* releases state (tab list) */
  const [releases, setReleases] = useState<Plugin["releases"] | null>(null);
  const [releasesLoading, setReleasesLoading] = useState<boolean>(true);
  const [releasesError, setReleasesError] = useState<string | null>(null);

  /* commits state (tab list) */
  const [commits, setCommits] = useState<PluginCommit[] | null>(null);
  const [commitsLoading, setCommitsLoading] = useState<boolean>(true);
  const [commitsError, setCommitsError] = useState<string | null>(null);

  /* gallery state (tab list) */
  const [galleryContent, setGalleryContent] = useState<string[] | null>(null);
  const [galleryLoading, setGalleryLoading] = useState<boolean>(true);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  /* sidebar: contributors */
  const [contributors, setContributors] = useState<
    Plugin["contributors"] | null
  >(null);
  const [contributorsLoading, setContributorsLoading] = useState<boolean>(true);
  const [contributorsError, setContributorsError] = useState<string | null>(
    null
  );

  /* sidebar: latest release */
  const [latestRelease, setLatestRelease] = useState<
    Plugin["releases"][0] | null
  >(null);
  const [latestLoading, setLatestLoading] = useState<boolean>(true);
  const [latestError, setLatestError] = useState<string | null>(null);

  /* handle report function */
  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await submitPluginReport(
      owner,
      name,
      reportCategory,
      reportDescription
    );

    if (success) {
      alert("Thank you! Your report has been submitted for review.");
      setIsInReporting(false);
      setReportCategory("");
      setReportDescription("");
    }
  };

  /* -------- fetch repo -------- */
  useEffect(() => {
    let alive = true;
    if (repo) return; // cached
    (async () => {
      try {
        setPluginLoading(true);
        setPluginError(null);
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${name}`
        );
        if (!res.ok)
          throw new Error(`GitHub error: ${res.status} ${res.statusText}`);
        const data: Plugin = await res.json();
        if (!alive) return;
        pluginCache.set(cacheKey, data);
        setPlugin(data);
      } catch (e: unknown) {
        if (!alive) return;
        setPluginError(
          (e as Error)?.message ?? "Failed to fetch repository info."
        );
      } finally {
        if (alive) setPluginLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [cacheKey, name, owner, repo]);

  /* -------- fetch plugin details from backend -------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!fromState?.id) {
          // If we don't have an ID from the list page, we can't fetch.
          // In a real app, you might have a fallback to fetch by owner/name.
          // For now, we'll navigate away.
          console.error(
            "No plugin ID provided in state. Cannot fetch details."
          );
          navigate("/plugins");
          return;
        }

        const plugin = await fetchPlugin(fromState.id);
        if (!alive || !plugin) return;

        // Populate individual states from the single backend response
        setReadme(plugin.readme);
        setReleases(plugin.releases);
        setGalleryContent(plugin.gallery);
        setContributors(plugin.contributors);
        setLatestRelease(plugin.releases?.[0] ?? null);
        setCommits(plugin.commits);
      } catch (e: unknown) {
        if (!alive) return;
        const msg = (e as Error)?.message ?? "Failed to load plugin details.";
        setReadmeError(msg);
        setReleasesError(msg);
        setGalleryError(msg);
        setContributorsError(msg);
        setLatestError(msg);
        setCommitsError(msg);
      } finally {
        if (alive) {
          setReadmeLoading(false);
          setReleasesLoading(false);
          setGalleryLoading(false);
          setContributorsLoading(false);
          setLatestLoading(false);
          setCommitsLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [fromState, navigate, owner, name]);

  /* -------- resolve relative links/images in README -------- */
  const defaultBranch = repo?.branch || "HEAD";
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
  const displayTitle =
    repo?.name ??
    (fromState
      ? `${fromState.owner.username}/${fromState.name}`
      : `${owner}/${name}`);
  const displayDesc = fromState?.description ?? repo?.description ?? "";
  const repoUrl =
    fromState?.url ??
    repo?.url ??
    (fromState
      ? `https://github.com/${fromState.owner.username}/${fromState.name}`
      : `https://github.com/${owner}/${name}`);

  /* ------- keywords: prefer plugin.keywords, fallback to repo topics ------- */
  const keywords = useMemo<string[]>(
    () => (fromState?.keywords?.length ? fromState.keywords : []),
    [fromState?.keywords]
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
              src={
                fromState?.logo ??
                "https://avatars.githubusercontent.com/u/92610726?s=88&v=4"
              }
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
                  aria-label={`${formatCount(
                    repo?.stars ?? fromState?.stars ?? 0
                  )} stargazers`}
                  title="View stargazers"
                >
                  <StarFillIcon size={16} verticalAlign="middle" />
                  {formatCount(repo?.stars ?? fromState?.stars ?? 0)} stars
                </a>
                <a
                  className="chip link"
                  href={`https://github.com/${owner}/${name}/network/members`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${formatCount(repo?.forks ?? 0)} forks`}
                  title="View forks"
                >
                  <RepoForkedIcon size={16} verticalAlign="middle" />
                  {formatCount(repo?.forks ?? 0)} forks
                </a>
                <a
                  className="chip link"
                  href={`https://github.com/${owner}/${name}/issues`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${formatCount(repo?.issues ?? 0)} issues`}
                  title="View issues"
                >
                  <IssueReopenedIcon size={16} verticalAlign="middle" />
                  {formatCount(repo?.issues ?? 0)} issues
                </a>
              </div>
            </div>
          </div>

          {/* Actions + Tabs row */}
          <div className="details-actions">
            {/* keywords */}
            <div className="details-actions-left">
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

            <div
              className="tabbar"
              role="tablist"
              aria-label="Repository content"
            >
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
                aria-selected={tab === "gallery"}
                className={`tab ${tab === "gallery" ? "active" : ""}`}
                onClick={() => setTab("gallery")}
              >
                Gallery
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
              <div
                className="modal-section"
                role="tabpanel"
                aria-label="README"
              >
                <h3 className="section-title">README</h3>
                {readmeLoading && (
                  <div className="modal-loading">
                    <span className="spinner" aria-hidden="true"></span>
                    <span>Loading README…</span>
                  </div>
                )}
                {readmeError && !readmeLoading && (
                  <div className="modal-error" role="alert">
                    {readmeError}
                  </div>
                )}
                {!readmeLoading && !readmeError && readme === "" && (
                  <p className="section-text" style={{ opacity: 0.85 }}>
                    No README found for this repository.
                  </p>
                )}
                {!readmeLoading && !readmeError && readme && (
                  <article className="markdown-body">
                    {/* The new backend provides full URLs, so we don't need resolveUrl anymore */}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {readme}
                    </ReactMarkdown>
                  </article>
                )}
              </div>
            )}

            {tab === "versions" && (
              <div
                className="modal-section"
                role="tabpanel"
                aria-label="Versions"
              >
                <h3 className="section-title">Releases</h3>
                {releasesLoading && !releases && (
                  <div className="modal-loading">
                    <span className="spinner" aria-hidden="true"></span>
                    <span>Loading releases…</span>
                  </div>
                )}
                {releasesError && !releasesLoading && (
                  <div className="modal-error" role="alert">
                    {releasesError}
                  </div>
                )}
                {!releasesLoading &&
                  !releasesError &&
                  (releases?.length ?? 0) === 0 && (
                    <p className="section-text" style={{ opacity: 0.85 }}>
                      No releases found.
                    </p>
                  )}
                {!!releases?.length && (
                  <ul className="release-list">
                    {releases.map((r) => (
                      <li key={r.name} className="release-item">
                        <div className="release-head">
                          <div className="release-titles">
                            <a // The backend provides a `PluginRelease` type which may differ.
                              className="release-name"
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {r.name || r.tag}
                            </a>
                            <span
                              className={`release-tag ${
                                r.prerelease ? "pre" : ""
                              }`}
                            >
                              {r.tag}
                              {r.prerelease ? " (pre-release)" : ""}
                            </span>
                          </div>
                          <div className="release-meta">
                            Published {formatDate(r.date)}
                          </div>
                        </div>

                        {r.description && (
                          <div className="release-body markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {r.description}
                            </ReactMarkdown>
                          </div>
                        )}

                        {r.assets?.length > 0 && (
                          <div className="assets">
                            {r.assets.map((a) => (
                              <a
                                key={a.name}
                                className="asset-chip"
                                href={a.download_url}
                                target="_blank"
                                rel="noreferrer"
                                title={`${a.name} • ${formatBytes(
                                  a.size
                                )} • ${a.download_count.toLocaleString()} downloads`}
                              >
                                <DownloadIcon size={16}></DownloadIcon>
                                {a.name} · {formatBytes(a.size)} ·{" "}
                                {a.download_count.toLocaleString()}
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
              <div
                className="modal-section"
                role="tabpanel"
                aria-label="Changelog"
              >
                <h3 className="section-title">Recent Commits</h3>
                {commitsLoading && !commits && (
                  <div className="modal-loading">
                    <span className="spinner" aria-hidden="true"></span>
                    <span>Loading commits…</span>
                  </div>
                )}
                {commitsError && !commitsLoading && (
                  <div className="modal-error" role="alert">
                    {commitsError}
                  </div>
                )}
                {!!commits?.length && (
                  <ul className="commit-list">
                    {commits.map((c) => {
                      // Commit data structure remains the same as it's from GitHub API
                      const firstLine = c.message.split("\n")[0];
                      const when = c.date ? formatDate(c.date) : "";
                      return (
                        <li key={c.sha} className="commit-item">
                          <a // The backend provides a `PluginRelease` type which may differ.
                            className="commit-msg"
                            href={`https://github.com/${owner}/${name}/commit/${c.sha}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {firstLine}
                          </a>
                          <div className="commit-meta">
                            {c.author ? <span>@{c.author}</span> : null}
                            {when && <span>• {when}</span>}
                            <span className="sha">{c.sha.substring(0, 7)}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!commitsLoading &&
                  !commitsError &&
                  (commits?.length ?? 0) === 0 && (
                    <p className="section-text" style={{ opacity: 0.85 }}>
                      No commits found.
                    </p>
                  )}
              </div>
            )}

            {tab === "gallery" && (
              <div
                className="modal-section"
                role="tabpanel"
                aria-label="Gallery"
              >
                <h3 className="section-title">Gallery</h3>
                {galleryLoading && !galleryContent && (
                  <div className="modal-loading">
                    <span className="spinner" aria-hidden="true"></span>
                    <span>Loading gallery…</span>
                  </div>
                )}
                {galleryError && !galleryLoading && (
                  <div className="modal-error" role="alert">
                    {galleryError}
                  </div>
                )}
                {!galleryLoading &&
                  !galleryError &&
                  (galleryContent?.length ?? 0) === 0 && (
                    <div className="gallery-empty">
                      <div className="icon">
                        <FileMediaIcon size={32} />
                      </div>
                      <p className="section-text">
                        No gallery content was found.
                        <br />
                        <small>
                          This plugin doesn't have any gallery content.
                        </small>
                      </p>
                    </div>
                  )}
                {!!galleryContent?.length && (
                  <div className="gallery-grid">
                    {galleryContent.map((url, index) => (
                      <div key={index} className="gallery-item">
                        {isVideoFile(url) ? (
                          <video src={url} controls muted loop playsInline />
                        ) : (
                          <img
                            src={url}
                            alt={`Gallery image ${index + 1}`}
                            loading="lazy"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: "1rem" }}>
              <Link to="/plugins" className="btn-link">
                ← Back to all plugins
              </Link>
            </div>
          </main>

          {/* Sidebar column */}
          <aside className="details-sidebar">
            {/* Purple CTA */}
            <div className="side-card">
              <a
                className="btn primary block"
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
              >
                <MarkGithubIcon size={16} />
                View on GitHub
              </a>
              <a
                className="btn primary issue block list"
                href={repoUrl + "/issues"}
                target="_blank"
                rel="noreferrer"
              >
                <IssueReopenedIcon size={16} />
                Create Issue
              </a>
            </div>

            {/* Latest release */}
            <div className="side-card">
              <h4 className="side-title">Latest Release</h4>
              {latestLoading && (
                <div className="modal-loading">
                  <span className="spinner" /> <span>Loading…</span>
                </div>
              )}
              {latestError && !latestLoading && (
                <div className="modal-error" role="alert">
                  {latestError}
                </div>
              )}
              {!latestLoading && !latestError && !latestRelease && (
                <p className="side-text" style={{ opacity: 0.85 }}>
                  No releases yet.
                </p>
              )}
              {latestRelease && (
                <>
                  <div className="latest-row">
                    <a
                      className="latest-name"
                      href={latestRelease.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {latestRelease.name || latestRelease.tag}
                    </a>
                    <span
                      className={`release-tag ${
                        latestRelease.prerelease ? "pre" : ""
                      }`}
                    >
                      {latestRelease.tag}
                      {latestRelease.prerelease ? " (pre)" : ""}
                    </span>
                  </div>
                  <div className="latest-meta">
                    {latestRelease.date
                      ? `Published ${formatDate(latestRelease.date)}`
                      : "Unpublished"}
                  </div>

                  {latestRelease.assets?.length > 0 && (
                    <div className="assets">
                      {latestRelease.assets.slice(0, 3).map((a) => (
                        <a
                          key={a.name}
                          className="asset-chip"
                          href={a.download_url}
                          target="_blank"
                          rel="noreferrer"
                          title={`${a.name} • ${formatBytes(
                            a.size
                          )} • ${a.download_count.toLocaleString()} downloads`}
                        >
                          <DownloadIcon size={16}></DownloadIcon>
                          {a.name} · {formatBytes(a.size)}
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
                <div className="modal-loading">
                  <span className="spinner" /> <span>Loading…</span>
                </div>
              )}
              {contributorsError && !contributorsLoading && (
                <div className="modal-error" role="alert">
                  {contributorsError}
                </div>
              )}
              {!contributorsLoading &&
                !contributorsError &&
                (contributors?.length ?? 0) === 0 && (
                  <p className="side-text" style={{ opacity: 0.85 }}>
                    No contributors yet.
                  </p>
                )}
              {!!contributors?.length && (
                <div className="contrib-grid">
                  {contributors.slice(0, 24).map((c) => (
                    <a
                      key={c.username}
                      className="contrib"
                      href={c.profile_url}
                      target="_blank"
                      rel="noreferrer"
                      title={`${c.username} • ${c.contributions} contribution${
                        c.contributions === 1 ? "" : "s"
                      }`}
                      aria-label={`${c.username} (${c.contributions} contributions)`}
                    >
                      <img src={c.avatar_url} alt={c.username} />
                    </a>
                  ))}
                </div>
              )}
            </div>
            {/* report the naughty plugins! */}
            <div className="side-card report-card">
              <button
                className="report-button"
                onClick={() => setIsInReporting(true)}
              >
                <AlertIcon size={16} /> Report this Plugin
              </button>
            </div>
          </aside>
        </div>
        {isInReporting && (
          <div className="report-modal-overlay">
            <div className="report-modal-content">
              <h3 className="report-modal-title">Report Plugin</h3>
              <p className="report-modal-desc">
                Why are you reporting{" "}
                <strong>
                  {owner}/{name}
                </strong>{" "}
                for review?
              </p>
              <form onSubmit={(e) => handleReport(e)} className="report-form">
                <div className="report-form-group">
                  <label htmlFor="report-category">Reason</label>
                  <select
                    id="report-category"
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select a category...
                    </option>
                    <option value="Plugin contains malicious content.">
                      Plugin contains malicious content.
                    </option>
                    <option value="Repository contains inappropriate content.">
                      Repository contains inappropriate content.
                    </option>
                    <option value="Repository isn't a plugin.">
                      Repository isn't a plugin.
                    </option>
                  </select>
                </div>
                <div className="report-form-group">
                  <label htmlFor="report-description">
                    Description (optional)
                  </label>
                  <textarea
                    id="report-description"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Provide additional details..."
                    rows={4}
                    maxLength={480}
                  ></textarea>
                </div>
                <div className="report-modal-actions">
                  <button
                    type="button"
                    className="btn primary cancel"
                    onClick={() => setIsInReporting(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn primary">
                    Submit Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
