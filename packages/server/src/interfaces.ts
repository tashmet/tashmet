import {AsyncFactory, Provider} from '@tashmit/core';
import {RequestHandler} from 'express';
import {AddressInfo} from 'net';

export abstract class RequestHandlerFactory extends AsyncFactory<RequestHandler> {
  public abstract create(path: string): Promise<RequestHandler>;
}

/**
 * Server middleware.
 */
export type Middleware =
  RequestHandler | RequestHandlerFactory | (RequestHandler | RequestHandlerFactory)[];

export type RouteMap = {[path: string]: Middleware};

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
  handlers: Middleware;
}

export interface ServerConfig {
  middleware: RouteMap;
}

export abstract class Server {
  public static configuration(config: ServerConfig) {
    return Provider.ofInstance('server.ServerConfig', config);
  }

  /**
   * Starts the server and listens for connections.
   *
   * @param port Port to listen on.
   */
  public abstract listen(port: number): any;

  public abstract address(): string | AddressInfo | null;
}
