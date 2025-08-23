import "../styles/layout.css";
import "./plugins.css";

const descriptionList = [
  "This is a short description of the plugin.", // Short description
  "This is a slightly longer description that gives a bit more detail about what the plugin does and how it can be useful in various scenarios.", // Medium description
  "This is a much longer description that goes into significant detail about the plugin's features, use cases, and benefits. It explains how the plugin can be integrated into different projects, the problems it solves, and provides examples of its functionality. This description is intended to give potential users a comprehensive understanding of what the plugin offers and why they might want to use it in their own work.", // Long description
]

const makeMockPlugins = (n = 30) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `Plugin ${i + 1}`,
    version: `v1.${i % 3}.${i % 10}`,
    author: `Author ${((i % 6) + 1)}`,
    logo: "/serenityjs.png",
    description: descriptionList[i % descriptionList.length],
  }));

export default function Plugins() {
  const plugins = makeMockPlugins(15);

  return (
    <section className="plugins-page">
      <div className="page-container">
        <header className="page-header">
          <h1>Plugins</h1>
          <p className="subtitle">Browse community plugins (showing test data)</p>
        </header>

        <div className="plugins-grid">
          {plugins.map((p) => (
            <article key={p.id} className="plugin-card" title={p.name}>
              <img src={p.logo} alt={`${p.name} logo`} className="plugin-logo" />
              <div className="plugin-meta">
                <div className="plugin-title-row">
                  <h2 className="plugin-name">{p.name}</h2>
                  <span className="version-badge">{p.version}</span>
                </div>
                <p className="plugin-author">{p.author}</p>
                <p className="plugin-desc">{p.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
