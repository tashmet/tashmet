import {Container, Logger, provider, Provider} from '@tashmet/core';
import http from 'http';
import {AddressInfo} from 'net';
import SocketIO from 'socket.io';
import express from 'express';
import {ServerConfig, Middleware, resolvers, Route, controllerName} from './interfaces';
import {SocketGateway} from './gateway';
import {QueryParser} from '@tashmet/qs-parser';
import {makeRoutes, mountRoutes} from './routing';
import {Resource, ResourceConfig} from './routers/resource';
import {RouterAnnotation} from './decorators/middleware';
import { HashCode } from '@tashmet/database';

export * from './decorators';
export * from './interfaces';
export * from './routers/resource';
//export * from './logging';
export {QueryParser} from '@tashmet/qs-parser';

@provider({
  key: HttpServer,
  inject: [
    ServerConfig,
    HttpServer.http,
    HttpServer.express,
    Logger.inScope('server'),
    SocketGateway,
    HashCode,
  ]
})
export default class HttpServer {
  public static http = resolvers.http;
  public static express = resolvers.express;
  public static socket = resolvers.socket;

  private static defaultConfig: ServerConfig = {
    middleware: {},
    queryParser: QueryParser.json(),
  }

  public constructor(
    private config: ServerConfig,
    public readonly http: http.Server,
    public readonly express: express.Application,
    private logger: Logger,
    private gateway: SocketGateway,
    private hashCode: HashCode,
  ) {};

  public router(path: string, controller: any) {
    const logger = this.logger.inScope('server.RouterFactory');

    logger.info(`'${path}' as ${controllerName(controller)}`);
    let routes: Route[] = [];

    for (const annotation of RouterAnnotation.onClass(controller.constructor, true)) {
      routes = routes.concat(annotation.routes(controller));
    }
    for (const route of routes) {
      logger.info(`  - ${route.method}\t'${route.path}'`);
    }
    this.gateway.register(controller, {namespace: path});

    return this.use(path, mountRoutes(express.Router(), ...routes));
  }

  public resource(path: string, {collection, queryParser, readOnly}: ResourceConfig) {
    return this.router(path, new Resource(
      collection,
      this.logger.inScope('Resource'),
      readOnly,
      queryParser || this.config.queryParser,
      this.hashCode,
    ));
  }

  public use(path: string, middleware: Middleware) {
    mountRoutes(this.express, ...makeRoutes({[path]: middleware}));
    return this;
  }

  public listen(port: number) {
    return this.http.listen(port);
  }

  public static configure(config: Partial<ServerConfig> = {}) {
    return (container: Container) => {
      container.register(SocketGateway);
      container.register(Provider.ofInstance(ServerConfig, {...HttpServer.defaultConfig, ...config}));

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

      container.register(HttpServer);
    };
  }
}