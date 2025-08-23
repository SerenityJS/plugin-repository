import "../styles/layout.css";

export default function Home() {
  return (
    <section className="home-page">
      <div className="page-container">
        <header className="page-header">
          <h1>Welcome to the Plugin Repository</h1>
          <p className="subtitle">Discover, publish, and manage community plugins</p>
        </header>

        {/* Optional: quick actions */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <a className="btn" href="/plugins">Browse Plugins</a>
          <a className="btn btn-secondary" href="/submit">Submit a Plugin</a>
        </div>
      </div>
    </section>
  );
}
