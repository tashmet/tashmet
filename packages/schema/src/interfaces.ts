export interface ValidationConfig {
  collection: string;
}

export abstract class Validator {
  public abstract validate(doc: any, schemaId: string): Promise<any>;
}
