import {Lookup} from '@tashmet/core';
import {QueryParser} from '@tashmet/qs-parser';
import {RequestHandler} from 'express';
import * as express from 'express';
import http from 'http';

export interface RequestHandlerContext {
  path: string;
}

/**
 * Server middleware.
 */
export type Middleware = RequestHandler;

export type RouteMap = {[path: string]: Middleware | Middleware[]};

export type RouteMethod =
  'checkout' |
  'copy' |
  'delete' |
  'get' |
  'head' |
  'lock' |
  'merge' |
  'mkactivity' |
  'mkcol' |
  'move' |
  'm-search' |
  'notify' |
  'options' |
  'patch' |
  'post' |
  'purge' |
  'put' |
  'report' |
  'search' |
  'subscribe' |
  'trace' |
  'unlock' |
  'unsubscribe';

export interface Route {
  path?: string;
  method?: RouteMethod;
  handlers: Middleware[];
}

export interface ServerConfig {
  queryParser: QueryParser;

  middleware: RouteMap;
}

export abstract class ServerConfig implements ServerConfig {}

export const resolvers = {
  express: Lookup.of<express.Application>('express.Application'),
  http: Lookup.of<http.Server>('http.Server'),
  socket: Lookup.of<SocketIO.Server>('socket.io.Server'),
}

export function controllerName(ctr: any): string {
  return typeof ctr.toString === 'function' ? ctr.toString() : ctr.constructor.name;
}