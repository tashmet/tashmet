/**
 *
 */
export interface CollectionConfig {
  /**
   * The name of the controller.
   */
  name: string;

  model?: string;

  populateAfter?: string[];
}

export interface RoutineConfig {
  appliesTo: string[];
}
