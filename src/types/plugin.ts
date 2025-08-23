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
   * The URL to the plugin's logo (from package.json or a placeholder).
   */
  logo?: string;
}

export type { Plugin };
