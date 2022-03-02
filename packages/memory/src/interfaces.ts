import {OperatorConfig} from '@tashmit/operators';

/**
 * Configuration for the database.
 */
export interface MemoryClientConfig {
  /**
   *
   */
  operators: OperatorConfig;
}

export abstract class MemoryClientConfig implements MemoryClientConfig {}
