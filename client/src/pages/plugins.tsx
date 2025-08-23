// src/pages/Plugins.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { fetchPlugins } from "../functions/fetch-plugins";
import { StarIcon, DownloadIcon } from "../components";

import "../styles/layout.css";
import "./plugins.css";
import type { Plugin } from "../types";

// Short number formatter: 1234 -> 1.2k, 1500000 -> 1.5M
const formatCount = (n: number) => {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${+(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}k`;
  if (n < 1_000_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  return `${+(n / 1_000_000_000).toFixed(1)}B`;
};

const KEYWORD_COLORS = ["#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#60a5fa", "#f87171", "#22d3ee"];

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
  // Supports "#tag" queries and multiple terms (AND logic).
  const filtered = useMemo(() => {
    if (!plugins) return [];
    if (!q) return plugins;

    const terms = q
      .split(/\s+/)
      .map((t) => t.replace(/^#/, "").toLowerCase())
      .filter(Boolean);

    if (terms.length === 0) return plugins;

    return plugins.filter((p) => {
      const haystack =
        [p.name, p.owner, p.description, ...p.keywords].join(" ").toLowerCase();

      // All terms must be present somewhere (name/owner/desc/keywords)
      return terms.every((t) => haystack.includes(t));
    });
  }, [plugins, q]);

  // Sorting unchanged (by stars or downloads with tie-breakers)
  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === "downloads") {
      list.sort((a, b) => {
        const diff = (b.downloads ?? 0) - (a.downloads ?? 0);
        if (diff) return diff;
        const starDiff = (b.stars ?? 0) - (a.stars ?? 0);
        if (starDiff) return starDiff;
        return a.name.localeCompare(b.name);
      });
    } else {
      list.sort((a, b) => {
        const diff = (b.stars ?? 0) - (a.stars ?? 0);
        if (diff) return diff;
        const dlDiff = (b.downloads ?? 0) - (a.downloads ?? 0);
        if (dlDiff) return dlDiff;
        return a.name.localeCompare(b.name);
      });
    }
    return list;
  }, [filtered, sort]);

  if (loading) {
    return (
      <section className="plugins-page">
        <div className="page-container">
          <header className="page-header">
            <h1>Plugins</h1>
            <p className="subtitle">Please wait while we fetch some plugins...</p>
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
          <p>Failed to load plugins. {error ? `(${error})` : "Please try again later."}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="plugins-page">
      <div className="page-container">
        <header className="page-header">
          <h1>Plugins</h1>
          <p className="subtitle">Browse community made plugins for SerenityJS</p>
        </header>

        {q && (
          <p className="subtitle results-info" style={{ marginTop: "-0.4rem" }}>
            Showing {sorted.length} result{sorted.length !== 1 ? "s" : ""} for “{q}”
          </p>
        )}

        <div className="plugins-grid">
          {sorted.map((plugin) => {
            const keywords = plugin.keywords;

            const redirect = () => {
              navigate(`/plugins/${encodeURIComponent(plugin.owner)}/${encodeURIComponent(plugin.name)}`, { state: { plugin } });
            }

            return (
              <article key={plugin.id} className="plugin-card" title={plugin.name} onClick={redirect}>
                <img src={plugin.logo ?? "/serenityjs.png"} alt={`${plugin.name} logo`} className="plugin-logo"/>

                <div className="plugin-meta">
                  <div className="plugin-title-row">
                    <h2 className="plugin-name">{plugin.name}</h2>
                    <span className="version-badge">{plugin.version}</span>
                  </div>
                  <p className={`plugin-desc ${plugin.description.length > 140 ? "truncated" : ""}`}>
                    {plugin.description}
                  </p>
                  {/* Keyword chips (between description and author) */}
                  {Array.isArray(keywords) && keywords.length > 0 && (
                    <div className="keyword-list">
                      {keywords.map((kw, i) => {
                        const color = KEYWORD_COLORS[i % KEYWORD_COLORS.length];
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
                    <span className="author-name">{plugin.owner}</span>
                    <span
                      className="author-stat"
                      title={`${plugin.stars.toLocaleString()} stars`}
                      aria-label={`${plugin.stars} stars`}
                    >
                      <StarIcon /> {formatCount(plugin.stars)}
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
