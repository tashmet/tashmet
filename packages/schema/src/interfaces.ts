export interface ValidationConfig {
  collection: string;
}

export interface Validator {
  validate(doc: any, schemaId: string): Promise<any>;
}
