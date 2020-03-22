import * as express from 'express';
import * as http from 'http';
import {AddressInfo} from 'net';
import {provider, Logger, Optional} from '@ziqquratu/ziqquratu';
import {Route, Server, ServerConfig} from './interfaces';
import {makeRoutes, mountRoutes} from './routing';

@provider({
  key: 'tashmetu.Server',
  inject: [
    'express.Application',
    'http.Server',
    'tashmetu.Logger',
    Optional.of('tashmetu.ServerConfig'),
  ]
})
export class TashmetuServer implements Server {
  private logger: Logger;

  public constructor(
    private app: express.Application,
    private server: http.Server,
    logger: Logger,
    config?: ServerConfig,
  ) {
    this.logger = logger.inScope('Server');
    if (config) {
      mountRoutes(this.app, ...makeRoutes(config.middleware));
    }
  }

  public mount(route: Route) {
    mountRoutes(this.app, route);
  }

  public listen(port: number): http.Server {
    this.logger.info(`listening on port ${port}`);
    return this.server.listen(port);
  }

  public address(): string | AddressInfo | null {
    return this.server.address();
  }
}
