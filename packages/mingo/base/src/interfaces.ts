import { JsonSchemaValidator } from "mingo/core";

/**
 * Configuration options for the mingo storage engine.
 */
export interface MingoConfig {
  /**
   * Enforces strict MongoDB compatibilty. See readme for differences. @default true.
   * When disabled, the $elemMatch projection operator returns all matching nested documents instead of only the first.
   */
  readonly useStrictMode?: boolean;

  /**
   * Enables or disables custom script execution.
   * When disabled, you cannot use operations that execute custom code, such as the $where, $accumulator, and $function.
   * @default true
   */
  readonly scriptEnabled?: boolean;

  jsonSchemaValidator?: JsonSchemaValidator;
}

export abstract class MingoConfig implements MingoConfig {}
