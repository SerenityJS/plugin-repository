// src/pages/Plugins.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { fetchPlugins } from "../functions/fetch-plugins";

import "../styles/layout.css";
import "./plugins.css";
import type { Plugin } from "../types";
import { DownloadIcon, StarFillIcon, SyncIcon } from "@primer/octicons-react";

// Short number formatter: 1234 -> 1.2k, 1500000 -> 1.5M
const formatCount = (n: number) => {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}k`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${(n / 1_000_000_000).toFixed(1)}B`;
};

// Relative date formatter: 4 hours ago, 6 days ago, etc.
const formatRelativeTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000; // Years
  if (interval > 1) return `${Math.floor(interval)} years ago`;
  interval = seconds / 2592000; // Months
  if (interval > 1) return `${Math.floor(interval)} months ago`;
  interval = seconds / 86400; // Days
  if (interval > 1) return `${Math.floor(interval)} days ago`;
  interval = seconds / 3600; // Hours
  if (interval > 1) return `${Math.floor(interval)} hours ago`;
  interval = seconds / 60; // Minutes
  if (interval > 1) return `${Math.floor(interval)} minutes ago`;
  return `${Math.floor(seconds)} seconds ago`;
};

const KEYWORD_COLORS = [
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
  "#f87171",
  "#22d3ee",
];

export default function Plugins() {
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").toLowerCase().trim();
  const sort = (params.get("sort") ?? "stars").toLowerCase();
  const navigate = useNavigate();

  const [plugins, setPlugins] = useState<Array<Plugin> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch plugins in-component
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPlugins();
        if (!alive) return;
        setPlugins(data || []);
      } catch (e: unknown) {
        if (!alive) return;
        const err = e as Error;
        setError(err?.message ?? "Failed to load plugins.");
        setPlugins(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Filter (includes name, owner, description, and keywords/tags).
  const filtered = useMemo(() => {
    if (!plugins) return [];
    if (!q) return plugins;

    const terms = q
      .split(/\s/)
      .map((t) => t.replace(/^#/, "").toLowerCase())
      .filter(Boolean);

    if (terms.length === 0) return plugins;

    return plugins.filter((p) => {
      const haystack = [p.name, p.owner.username, p.description, ...p.keywords]
        .join(" ")
        .toLowerCase();

      // All terms must be present somewhere (name/owner/desc/keywords)
      return terms.every((t) => haystack.includes(t));
    });
  }, [plugins, q]);

  // Sort plugins based on the selected sort option.
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const dateDiff =
        new Date(b.updated).getTime() - new Date(a.updated).getTime();

      switch (sort) {
        case "downloads": {
          const downloadDiff = (b.downloads ?? 0) - (a.downloads ?? 0);
          if (downloadDiff !== 0) return downloadDiff;
          break;
        }
        case "stars": {
          const starDiff = (b.stars ?? 0) - (a.stars ?? 0);
          if (starDiff !== 0) return starDiff;
          break;
        }
        case "published": {
          return (
            new Date(b.published).getTime() - new Date(a.published).getTime()
          );
        }
        case "updated":
        default: {
          if (dateDiff !== 0) return dateDiff;
          break;
        }
      }
      // Fallback sorting
      if (dateDiff !== 0) return dateDiff;
      const starDiff = (b.stars ?? 0) - (a.stars ?? 0);
      if (starDiff !== 0) return starDiff;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [filtered, sort]);

  if (loading) {
    return (
      <section className="plugins-page">
        <div className="page-container">
          <header className="page-header">
            <h1>Plugins</h1>
            <p className="subtitle">
              Please wait while we fetch some plugins...
            </p>
          </header>
        </div>
      </section>
    );
  }

  if (error || !plugins) {
    return (
      <section className="plugins-page">
        <div className="page-container">
          <header className="page-header">
            <h1>Plugins</h1>
            <p className="subtitle">Browse community plugins</p>
          </header>
          <p>
            Failed to load plugins.{" "}
            {error ? `(${error})` : "Please try again later."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="plugins-page">
      <div className="page-container">
        <header className="page-header">
          <h1>Plugins</h1>
          <p className="subtitle">
            Browse community made plugins for SerenityJS
          </p>
        </header>

        {q && (
          <p className="subtitle results-info" style={{ marginTop: "-0.4rem" }}>
            Showing {sorted.length} result{sorted.length !== 1 ? "s" : ""} for “
            {q}”
          </p>
        )}

        <div className="plugins-grid">
          {sorted.map((plugin) => {
            const redirect = () => {
              navigate(
                `/plugins/${encodeURIComponent(
                  plugin.owner.username
                )}/${encodeURIComponent(plugin.name)}`,
                { state: { plugin } }
              );
            };

            return (
              <article
                key={plugin.id}
                className="plugin-card"
                title={plugin.name}
                onClick={redirect}
              >
                {plugin.banner && (
                  <img
                    src={plugin.banner}
                    alt="" // Decorative
                    className="plugin-banner"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
                <img
                  src={
                    plugin.logo ??
                    "https://avatars.githubusercontent.com/u/92610726?s=88&v=4"
                  }
                  alt={`${plugin.name} logo`}
                  className="plugin-logo"
                />

                <div className="plugin-meta">
                  <div className="plugin-title-row">
                    <h2 className="plugin-name">{plugin.name}</h2>
                    <span className="version-badge">{plugin.version}</span>
                  </div>
                  <p
                    className={`plugin-desc ${
                      plugin.description.length > 140 ? "truncated" : ""
                    }`}
                  >
                    {plugin.description}
                  </p>
                  {/* Keyword chips */}
                  {Array.isArray(plugin.keywords) &&
                    plugin.keywords.length > 0 && (
                      <div className="keyword-list">
                        {/* Limit keywords to first 9 */}
                        {plugin.keywords.slice(0, 9).map((kw, i) => {
                          const color =
                            KEYWORD_COLORS[i % KEYWORD_COLORS.length];
                          return (
                            <span
                              key={`${plugin.id}-kw-${i}-${kw}`}
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
                  <p className="plugin-author">
                    <img
                      src={plugin.owner.avatar_url}
                      alt={plugin.owner.username}
                      className="author-avatar"
                    />
                    <div className="author-info">
                      <span className="author-name">
                        {plugin.owner.username}
                      </span>
                      {/* Last updated text */}
                      {plugin.updated && (
                        <div
                          className="plugin-last-updated"
                          title={`Last updated: ${new Date(
                            plugin.updated
                          ).toLocaleString()}`}
                        >
                          <SyncIcon />
                          <span>{formatRelativeTime(plugin.updated)}</span>
                        </div>
                      )}
                    </div>
                    <span
                      className="author-stat"
                      title={`${plugin.stars.toLocaleString()} stars`}
                      aria-label={`${plugin.stars} stars`}
                    >
                      <StarFillIcon /> {formatCount(plugin.stars)}
                    </span>
                    <span
                      className="author-stat"
                      title={`${plugin.downloads.toLocaleString()} downloads`}
                      aria-label={`${plugin.downloads} downloads`}
                    >
                      <DownloadIcon /> {formatCount(plugin.downloads)}
                    </span>
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="subtitle" style={{ marginTop: "1rem" }}>
            No plugins match your search.
          </p>
        )}
      </div>
    </section>
  );
}
