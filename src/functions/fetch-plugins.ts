import type { Plugin } from "../types";

const ENDPOINT = "https://api.github.com/search/repositories?q=topic:serenityjs-plugin&per_page=100";

interface GithubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{
    id: number;
    name: string;
    full_name: string;
    description: string;
    owner: { login: string; };
    stargazers_count: number;
    default_branch: string;
  }>;
}

// Simple in-memory cache to avoid redundant network requests
const CACHE: Array<Plugin> = [];

// Amount of time to keep the cache (in milliseconds)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Store the timestamp of the last fetch
let lastFetch = 0;

async function fetchPlugins(): Promise<Array<Plugin> | null> {
  // If the cache is still valid, return the cached data
  const now = Date.now();

  // Check if the cache is still valid
  if (now - lastFetch < CACHE_DURATION && CACHE.length > 0) {
    console.log("Using cached plugins data");

    return CACHE;
  }

  // Update the last fetch time
  lastFetch = now;

  // Fetch data from the GitHub API
  const response = await fetch(ENDPOINT);

  // Check if the response is ok (status code 200-299)
  if (response.ok) {
    // Prepare an array to hold the plugins
    const plugins: Plugin[] = [];

    // Read the response body for more details
    const result = JSON.parse((await response.text())) as GithubSearchResponse;

    // Iterate over the items and log plugin details
    for (let i = 0; i < result.total_count; i++) {
      // Get each repository item
      const repo = result.items[i];

      // Additionally, fetch the package.json file from the repository
      const presult = await fetch(`https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/package.json`)

      // If the package.json file is not found, skip this repository
      if (!presult.ok) continue;

      // Parse the package.json content
      const pkg = JSON.parse((await presult.text())) as { version?: string; logo?: string; keywords?: Array<string>; };

      // Additionally, fetch the releases to get download counts
      const rresult = await fetch(`https://api.github.com/repos/${repo.full_name}/releases`);

      // If the releases are not found, skip this repository
      if (!rresult.ok) continue;

      // Parse the releases content
      const releases = JSON.parse((await rresult.text())) as Array<{ assets: Array<{ download_count: number; }>; }>;

      // Check if there are no releases.
      if (releases.length <= 0) continue;

      // Get the latest release (first in the list)
      const latestRelease = releases[0]!;

      // Construct the logo URL (assuming it's in the public/logo.png path)
      let logo = `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/public/logo.png`;

      // Check if the logo exists by making a HEAD request
      const logoResponse = await fetch(logo, { method: "HEAD" });

      // If the logo does not exist, use a placeholder
      if (!logoResponse.ok) logo = "https://avatars.githubusercontent.com/u/92610726?s=88&v=4";

      // Create a Plugin object
      const plugin: Plugin = {
        id: repo.id,
        name: repo.name,
        description: repo.description,
        version: pkg.version ?? "",
        owner: repo.owner.login,
        stars: repo.stargazers_count,
        downloads: latestRelease.assets.reduce((sum, asset) => sum + asset.download_count, 0),
        keywords: Array.isArray(pkg.keywords) ? pkg.keywords.filter(k => typeof k === "string") : [],
        logo,
      };

      // Add the plugin to the array
      plugins.push(plugin);
    }

    // Update the cache, making sure there are no duplicates
    for (const plugin of plugins) {
      // Attempt to find the plugin in the cache by its ID
      if (!CACHE.find(p => p.id === plugin.id)) {
        CACHE.push(plugin); // Push only if not already present
      }
    }

    // Return the array of plugins
    return plugins;
  }

  return null;
}

export { fetchPlugins };