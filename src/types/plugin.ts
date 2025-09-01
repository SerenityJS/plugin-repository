interface Plugin {
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
   * The current version of the plugin (from package.json).
   */
  version: string;

  /**
   * The owner of the plugin (GitHub username).
   */
  owner: string;

  /**
   * The URL to the repo owner's profile picture.
   */
  ownerIconURL: string;

  /**

  /**
   * The number of stars the plugin has on GitHub (GitHub stargazers count).
   */
  stars: number;

  /**
   * The number of downloads the plugin has (GitHub releases download count).
   */
  downloads: number;

  /**
   * The keywords associated with the plugin (from package.json keywords).
   */
  keywords: Array<string>;

  /**
   * The URL to the plugin's logo (from /public/logo.png).
   */
  logo?: string;

  /**
   * The URL to the plugin's banner (from /public/banner.png).
   */
  banner?: string;

  /**
   * Date the plugin was published.
   */
  published: string;

  /**
   * Date the plugin was last updated (most recent release, not commit).
   */
  updated: string;
}

export type { Plugin };
