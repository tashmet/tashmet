import {Container, Logger, Plugin, Provider, ServiceRequest} from '@tashmit/core';
import http from 'http';
import {AddressInfo} from 'net';
import SocketIO from 'socket.io';
import express from 'express';
import {ServerConfig, Middleware, resolvers} from './interfaces';
import {SocketGateway} from './gateway';
import {QueryParser} from '@tashmit/qs-parser';
import {makeRoutes, mountRoutes} from './routing';
import {resource, ResourceConfig} from './routers/resource';
import {router, ControllerFactory} from './controller';

export * from './controller';
export * from './decorators';
export * from './interfaces';
export * from './routers/resource';
export * from './logging';
export {QueryParser} from '@tashmit/qs-parser';

export default class HttpServer extends Plugin {
  public static http = resolvers.http;
  public static express = resolvers.express;
  public static socket = resolvers.socket;

  private static defaultConfig: ServerConfig = {
    middleware: {},
    queryParser: QueryParser.json(),
  }

  private config: ServerConfig;

  public constructor(config: Partial<ServerConfig> = {}) {
    super();
    this.config = {...HttpServer.defaultConfig, ...config};
  }

  public router(path: string, factOrProvider: ServiceRequest<any> | ControllerFactory) {
    return this.use(path, router(factOrProvider));
  }

  public resource(path: string, config: ResourceConfig) {
    return this.use(path, resource(config));
  }

  public use(path: string, middleware: Middleware) {
    const toArray = (value: any | any[]) => Array.isArray(value) ? value : [value];
    let mwList = [middleware];

    if (path in this.config.middleware) {
      mwList = toArray(this.config.middleware[path]).concat(mwList)
    }
    this.config.middleware[path] = mwList;
    return this;
  }

  public register(container: Container) {
    container.register(SocketGateway);
    container.register(Provider.ofInstance(ServerConfig, this.config));

    container.register(Provider.ofFactory({
      key: HttpServer.express.key,
      create: () => express(),
    }));

    container.register(Provider.ofFactory({
      key: HttpServer.http.key,
      inject: [HttpServer.express, Logger.inScope('http-server.Server')],
      create: (app: express.Application, logger: Logger) => {
        const server = http.createServer(app);
        return server.addListener('listening', () => {
          logger.info('listening on port ' + (server.address() as AddressInfo).port);
        });
      },
    }));

    container.register(Provider.ofFactory({
      key: HttpServer.socket.key,
      inject: [HttpServer.http],
      create: (server: http.Server) => SocketIO(server),
    }));
  }

  public setup(container: Container) {
    mountRoutes(container.resolve(
      HttpServer.express), container, ...makeRoutes(this.config.middleware)
    );
  }
}