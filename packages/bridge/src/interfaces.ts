import ev from "eventemitter3";
import ObjectId from 'bson-objectid';
import { ChangeSet } from "./changeSet.js";

export const { EventEmitter } = ev;
export type Document = Record<string, any>;
export interface Namespace {db: string, coll: string};

export const nsToString = (ns: Namespace): string => `${ns.db}.${ns.coll}`;


/** Given an object shaped type, return the type of the _id field or default to ObjectId @public */
export type InferIdType<TSchema> = TSchema extends { _id: infer IdType } // user has defined a type for _id
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {} extends IdType // TODO(NODE-3285): Improve type readability
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      Exclude<IdType, {}>
    : unknown extends IdType
    ? ObjectId
    : IdType
  : ObjectId; // user has not defined _id on schema

export abstract class Bridge extends EventEmitter {
  public abstract command(ns: Namespace, command: Document): Promise<Document>;
}

export type CommandFunction = (ns: Namespace, command: Document) => Promise<Document>
export type Middleware = (next: CommandFunction) => CommandFunction;

export interface Comparator {
  /**
   * Generate a change-set by comparing two collections
   *
   * @param a Collection before changes
   * @param b Collection after changes
   * @returns A change-set
   */
  difference<TSchema extends Document>(a: TSchema[], b: TSchema[]): ChangeSet<TSchema>;
}

export abstract class Comparator implements Comparator {}