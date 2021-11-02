import {Container, Logger, Plugin, Provider} from '@tashmit/core';
import http from 'http';
import {AddressInfo} from 'net';
import SocketIO from 'socket.io';
import express from 'express';
import {ServerConfig, resolvers} from './interfaces';
import {SocketGateway} from './gateway';
import {QueryParser} from '@tashmit/qs-parser';
import {makeRoutes, mountRoutes} from './routing';

export * from './controller';
export * from './decorators';
export * from './interfaces';
export * from './routers/resource';
export * from './logging';
export {QueryParser} from '@tashmit/qs-parser';

export default class HttpServerPlugin extends Plugin {
  public static http = resolvers.http;
  public static express = resolvers.express;
  public static socket = resolvers.socket;

  public static withConfiguration(config: Partial<ServerConfig>) {
    const defaultConfig: ServerConfig = {
      middleware: {},
      queryParser: QueryParser.json(),
    };

    return new HttpServerPlugin({...defaultConfig, ...config});
  }

  public constructor(private config: ServerConfig) {
    super();
  }

  public register(container: Container) {
    container.register(SocketGateway);
    container.register(Provider.ofInstance(ServerConfig, this.config));

    container.register(Provider.ofFactory({
      key: HttpServerPlugin.express.key,
      create: () => {
        const app = express();
        mountRoutes(app, container, ...makeRoutes(this.config.middleware));
        return app;
      }
    }));

    container.register(Provider.ofFactory({
      key: HttpServerPlugin.http.key,
      inject: [HttpServerPlugin.express, Logger.inScope('http-server.Server')],
      create: (app: express.Application, logger: Logger) => {
        const server = http.createServer(app);
        return server.addListener('listening', () => {
          logger.info('listening on port ' + (server.address() as AddressInfo).port);
        });
      },
    }));

    container.register(Provider.ofFactory({
      key: HttpServerPlugin.socket.key,
      inject: [HttpServerPlugin.http],
      create: (server: http.Server) => SocketIO(server),
    }));
  }
}