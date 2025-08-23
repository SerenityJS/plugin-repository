// src/components/Navbar.tsx
import { NavLink, useSearchParams, useMatch } from "react-router-dom";
import "./navbar.css";

export default function Navbar() {
  // Only match the exact /plugins route (no children)
  const matchPluginsRoot = useMatch({ path: "/plugins", end: true });
  const showPluginsActions = Boolean(matchPluginsRoot);

  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const sort = params.get("sort") ?? "stars";

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const next = new URLSearchParams(params);
    if (v) next.set("q", v);
    else next.delete("q");
    setParams(next, { replace: true });
  };

  const onSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    const next = new URLSearchParams(params);
    if (v) next.set("sort", v);
    else next.delete("sort");
    setParams(next, { replace: true });
  };

  return (
    <header className="navbar">
      <div className="nav-left">
        <NavLink to="/" className="logo" aria-label="Home">
          <img
            src="https://raw.githubusercontent.com/SerenityJS/serenity/develop/public/serenityjs-banner.png"
            alt="SerenityJS"
            className="logo-img"
          />
        </NavLink>
      </div>

      <nav className="nav-center">
        <ul className="nav-links">
          <li><NavLink to="/" end>Home</NavLink></li>
          <li><NavLink to="/plugins">Plugins</NavLink></li>
          <li><NavLink to="/submit">Submit Plugin</NavLink></li>
        </ul>
      </nav>

      {/* Keep the right column for grid balance; render actions only on /plugins */}
      <div className="nav-right">
        {showPluginsActions && (
          <div className="nav-actions">
            <form className="nav-search" role="search" onSubmit={(e) => e.preventDefault()}>
              <input
                type="search"
                placeholder="Search plugins…"
                aria-label="Search plugins"
                value={q}
                onChange={onSearchChange}
              />
            </form>

            <div className="nav-sort">
              <span className="sr-only">Sort by</span>
              <select aria-label="Sort plugins" value={sort} onChange={onSortChange}>
                <option value="stars">Stars</option>
                <option value="downloads">Downloads</option>
              </select>
              <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 10l5 5 5-5H7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
