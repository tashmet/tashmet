import * as express from 'express';
import * as http from 'http';
import {AddressInfo} from 'net';
import {provider, Logger, Optional, Container} from '@tashmit/core';
import {Route, Server, ServerConfig} from './interfaces';
import {makeRoutes, mountRoutes} from './routing';

@provider({
  key: Server,
  inject: [
    'express.Application',
    'http.Server',
    Container,
    Logger.inScope('sever'),
    Optional.of('server.ServerConfig'),
  ]
})
export class ExpressServer extends Server {
  private logger: Logger;

  public constructor(
    private app: express.Application,
    private server: http.Server,
    private container: Container,
    logger: Logger,
    config?: ServerConfig,
  ) {
    super();
    this.logger = logger.inScope('Server');
    if (config) {
      mountRoutes(this.app, container, ...makeRoutes(config.middleware));
    }
  }

  public mount(route: Route) {
    mountRoutes(this.app, this.container, route);
  }

  public listen(port: number): http.Server {
    this.logger.info(`listening on port ${port}`);
    return this.server.listen(port);
  }

  public address(): string | AddressInfo | null {
    return this.server.address();
  }
}
