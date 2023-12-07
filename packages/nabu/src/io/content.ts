import { Document } from "@tashmet/tashmet";

export interface ContentRuleOptions {
  merge?: Document;

  construct?: Document;
}


export interface FileFormat {
  reader(expr: any): Document;
  writer(expr: any): Document;
}
