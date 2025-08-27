import "../styles/layout.css";
import "./submit.css";

export default function Submit() {
  return (
    <section className="submit-page">
      <div className="page-container">
        <header className="page-header">
          <h1>Submit a Plugin</h1>
          <p className="subtitle">
            Plugins are discovered automatically once they meet the requirements below
          </p>
        </header>

        <div className="submit-grid">
          {/* Requirements / How to be indexed */}
          <section className="card">
            <h2 className="card-title">Requirements</h2>
            <ol className="steps">
              <li>
                <strong>Start from the template.</strong> Generate your repo using{" "}
                <a
                  href="https://github.com/SerenityJS/sample-plugin"
                  target="_blank"
                  rel="noreferrer"
                >
                  SerenityJS/sample-plugin
                </a>{" "}
                for the recommended structure.
              </li>
              <li>
                <strong>Add a logo in <code>/public</code>.</strong> The site reads your plugin
                logo from the repository root’s <code>/public</code> folder (for example{" "}
                <code>/public/serenityjs.png</code>).
              </li>
              <li>
                <strong>Create a GitHub Release.</strong> Only repositories with at least one
                release (e.g. <code>v1.0.0</code>) are listed.
              </li>
              <li>
                <strong>Tag the repository.</strong> Add the topic{" "}
                <code>serenityjs-plugin</code> on GitHub. Only repos with this topic are indexed.
              </li>
            </ol>

            <div className="reqs">
              <div className="req ok">Public GitHub repo</div>
              <div className="req ok"><code>serenityjs-plugin</code> topic</div>
              <div className="req ok">At least one Release</div>
              <div className="req ok">Logo in <code>/public</code></div>
            </div>
          </section>

          {/* How it works + troubleshooting */}
          <section className="card">
            <h2 className="card-title">How it works</h2>
            <p className="body">
              The directory periodically crawls GitHub for repositories that match the
              criteria above. When your plugin satisfies all requirements, it will
              appear in the <strong>Plugins</strong> page automatically.
            </p>

            <h3 className="subhead">Troubleshooting</h3>
            <ul className="list">
              <li>
                <strong>Not showing?</strong> Confirm the repo is public, has at least one
                release, and includes the <code>serenityjs-plugin</code> topic.
              </li>
              <li>
                <strong>Logo missing?</strong> Ensure the image lives at{" "}
                <code>/public/&lt;your-logo&gt;.png</code> (or .jpg/.svg) in the repo root.
              </li>
              <li>
                <strong>Wrong name/description?</strong> Update your repo name/description
                and README on GitHub.
              </li>
            </ul>

            <div className="actions">
              <a
                className="btn btn-docs"
                href="https://github.com/SerenityJS/sample-plugin"
                target="_blank"
                rel="noreferrer"
              >
                View Template
              </a>
              <a className="btn btn-docs" href="/plugins">
                Browse Plugins
              </a>
              <a
                className="btn btn-docs"
                href="https://www.serenityjs.net"
                target="_blank"
                rel="noreferrer"
              >
                Documentation
              </a>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
