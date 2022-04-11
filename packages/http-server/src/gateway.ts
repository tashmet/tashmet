import {provider, Logger} from '@tashmet/tashmet';
import * as SocketIO from 'socket.io';
import {controllerName} from './interfaces';

export interface GatewayConfig {
  namespace?: string;
}

@provider({
  inject: [
    'socket.io.Server',
    Logger.inScope('server'),
  ]
})
export class SocketGateway {
  private logger: Logger;

  public constructor(
    private socket: SocketIO.Server,
    logger: Logger
  ) {
    this.logger = logger.inScope('SocketGateway');
  }

  public register(instance: any, config?: GatewayConfig) {
    if (typeof instance.onConnection === 'function') {
      const name = config ? config.namespace : undefined;

      const nsp = name
        ? this.socket.of(name)
        : this.socket;

      nsp.on('connection', socket => {
        this.logger.inScope('connection').info(`'${name || '/'}' to ${controllerName(instance)}`);
        instance.onConnection(socket);
        socket.on('disconnect', () => {
          this.logger.inScope('disconnect').info(`'${name || '/'}'`);
        });
      });
    }
  }
}
