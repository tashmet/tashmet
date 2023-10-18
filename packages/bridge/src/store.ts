import { Document, Namespace, EventEmitter } from "./interfaces.js";

export abstract class Store extends EventEmitter {
  public constructor() {
    super();
  }

  public abstract command(ns: Namespace, command: Document): Promise<Document>;
}
