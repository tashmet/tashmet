/**
 * Common configuration options for filters
 */
export interface FilterConfig {
  /**
   * Optional list of keys in the filter that should be monitored for changes.
   *
   * By monitoring a change in value for a given key the filter can itself trigger a refresh in
   * the view when it has been changed.
   */
  observe?: string[];
}
