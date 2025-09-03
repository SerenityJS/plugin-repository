interface PluginContributor {
  /**
   * Github username of contributor.
   */
  username: string;
  /**
   * Github profile URL of contributor.
   */
  profile_url: string;
  /**
   * Github avatar icon URL of contributor.
   */
  avatar_url: string;
  /**
   * How many times they've contributed, I think?
   */
  contributions: number;
}

interface PluginReleaseAsset {
  /**
   * Name of asset.
   */
  name: string;
  /**
   * File size of asset.
   */
  size: number;
  /**
   * Download URL.
   */
  download_url: string;
  /**
   * How many times the asset has been downloaded.
   */
  download_count: number;
}

export interface PluginRelease {
  /**
   * Name of the release.
   */
  name: string;
  /**
   * Tag for the release.
   */
  tag: string;
  /**
   * URL for the release.
   */
  url: string;
  /**
   * Description of the release.
   */
  description: string;
  /**
   * Whether or not it is a pre-release.
   */
  prerelease: boolean;
  /**
   * Date release was published.
   */
  date: string;
  /**
   * List of assets.
   */
  assets: Array<PluginReleaseAsset>;
  /**
   * Published date.
   */
  published: string;
}

export type PluginCommit = {
  sha: string;
  html_url: string;
  message: string;
  date: string;
  author: string;
};

export interface Plugin {
  /**
   * The unique identifier of the plugin (GitHub repository ID).
   */
  id: number;

  /**
   * The name of the plugin (GitHub repository name).
   */
  name: string;

  /**
   * A brief description of the plugin (GitHub repository description).
   */
  description: string;

  /**
   * The current version of the plugin (from the latest release).
   */
  version: string;

  /**
   * The owner of the plugin's repository, containing their details.
   */
  owner: PluginContributor;

  /**
   * The number of stars the plugin has on GitHub.
   */
  stars: number;

  /**
   * The total number of downloads across all release assets.
   */
  downloads: number;

  /**
   * The total number of repo forks.
   */
  forks: number;

  /**
   * The total number of open issues.
   */
  issues: number;

  /**
   * Keywords associated with the plugin, used for searching and filtering.
   */
  keywords: Array<string>;

  /**
   * The URL to the plugin's logo.
   */
  logo: string;

  /**
   * The URL to the plugin's banner image, if one exists.
   */
  banner: string | null;

  /**
   * The date the plugin was first published (first release date).
   */
  published: string;

  /**
   * The date the plugin was last updated (latest release date).
   */
  updated: string;

  /**
   * URL to plugin repo.
   */
  url: string;

  /**
   * Whether or not the plugin has been approved by moderators.
   */
  approved: boolean;

  /**
   * Full content of README.
   */
  readme: string;

  /**
   * List of URLs for gallery content.
   */
  gallery: Array<string>;

  /**
   * List of github contributors.
   */
  contributors: Array<PluginContributor>;

  /**
   * List of github releases.
   */
  releases: Array<PluginRelease>;

  /**
   * List of github commits.
   */
  commits: Array<PluginCommit>;

  /**
   * Default branch to query.
   */
  branch: string;
}
