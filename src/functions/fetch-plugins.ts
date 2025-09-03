import type { Plugin } from "../types";

const PLUGINS_ENDPOINT = "https://api.serenityjs.net/plugins";
const DETAILS_ENDPOINT = "https://api.serenityjs.net/plugin";

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
    console.log("Using cached plugins data.");
    return CACHE;
  }

  try {
    // Fetch data from backend.
    const response = await fetch(PLUGINS_ENDPOINT);

    // Check if successful
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const plugins: Array<Plugin> = await response.json();

    // Update the last fetch time
    lastFetch = now;
    CACHE.length = 0; // Clear old cache
    CACHE.push(...plugins); // Add new data

    return plugins;
  } catch (error) {
    console.error("Failed to fetch plugins:", error);
    return null;
  }
}

async function fetchPlugin(id: number): Promise<Plugin | null> {
  // Use cached version if available.
  const now = Date.now();

  // Check if the cache is still valid
  if (now - lastFetch < CACHE_DURATION && CACHE.length > 0) {
    console.log("Using cached plugins data.");
    if (CACHE.some((x) => x.id === id)) {
      console.log(JSON.stringify(CACHE.find((x) => x.id === id)!, null, 2));
      return CACHE.find((x) => x.id === id)!;
    }
  }

  try {
    // Fetch data from backend.
    const response = await fetch(`${DETAILS_ENDPOINT}/${id}`);

    // Check if successful
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const plugin: Plugin = await response.json();

    // Add new data to cache
    const index = CACHE.indexOf(plugin);
    if (index) CACHE.slice(index, 1);
    CACHE.push(plugin);

    return plugin;
  } catch (error) {
    console.error("Failed to fetch plugin details for", id, ":", error);
    return null;
  }
}

export { fetchPlugins, fetchPlugin };
