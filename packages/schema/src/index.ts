import Ajv, { Schema } from "ajv"
import { Container, PluginConfigurator, provider } from "@tashmet/core";
import { Document } from '@tashmet/tashmet';
import { JsonSchemaValidator } from "@tashmet/engine";

@provider({
  key: JsonSchemaValidator
})
export class AjvJsonSchemaValidator extends JsonSchemaValidator {
  public validate(doc: Document, schema: Document) {
    const ajv = new Ajv();
    const v = ajv.compile(schema as Schema);
    return (v(doc) ? true : false)
  }
}

export default () => (container: Container) =>
  new PluginConfigurator(AjvJsonSchemaValidator, container);
