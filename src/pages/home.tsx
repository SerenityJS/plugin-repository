import "../styles/layout.css";
import "./home.css";

export default function Home() {
  return (
    <section className="home-page">
      <div className="page-container">
        <header className="page-header">
          <h1>Welcome to the SerenityJS Plugin Repository</h1>
          <p className="subtitle">
            Discover, publish, and manage community plugins for SerenityJS
          </p>
        </header>

        {/* Quick actions */}
        <div className="actions">
          <a className="btn btn-docs" href="/plugins">Browse Plugins</a>
          <a className="btn btn-docs" href="/submit">Submit a Plugin</a>
          <a className="btn btn-docs" href="https://www.serenityjs.net" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>

        {/* Info Section */}
        <section className="info">
          <h2>Getting Started</h2>
          <p>
            The plugin system in <strong>SerenityJS</strong> is simple to use and extend. Place your
            plugin inside the <code>plugins</code> directory of your <strong>SerenityJS</strong> server.
            Once the server starts, it will automatically recognize and process your
            plugin. Plugins can be written in JavaScript or Typescript, which allows for
            flexibility and ease of use.
          </p>

          <p>
            This repository is a community-driven collection of plugins for <strong>SerenityJS</strong>. All plugins
            listed here are contributed by the community and are not officially maintained by the 
            <strong>SerenityJS</strong> team. Please review each plugin's documentation and repository for details on
            usage, maintenance, and support. Also it is recommended to check the plugin's code
            quality and security before using it in your projects.
          </p>

          <p>
            For more details, visit our official{" "}
            <a href="https://www.serenityjs.net" target="_blank" rel="noreferrer">documentation site</a>.
          </p>
        </section>
      </div>
    </section>
  );
}
