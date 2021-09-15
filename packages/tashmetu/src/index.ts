import {component, Logger, Provider} from '@ziqquratu/core';
import http from 'http';
import SocketIO from 'socket.io';
import express from 'express';
import {TashmetuServer} from './server';
import {SocketGateway} from './gateway';
import {ResourceFactory} from './routers/resource';
import {RouterFactory, ProviderControllerFactory} from './controller';
import {RequestLoggerFactory} from './logging';

export * from './controller';
export * from './decorators';
export * from './interfaces';
export * from './routers/resource';
export * from './logging';

@component({
  providers: [
    SocketGateway,
    TashmetuServer,
    Provider.ofInstance('express.Application', express()),
    Provider.ofFactory({
      key: 'http.Server',
      inject: ['express.Application'],
      create: (app: express.Application) => http.createServer(app),
    }),
    Provider.ofFactory({
      key: 'socket.io.Server',
      inject: ['http.Server'],
      create: (server: http.Server) => SocketIO(server),
    }),
    Provider.ofFactory({
      key: 'tashmetu.Logger',
      inject: [Logger],
      create: (logger: Logger) => logger.inScope('tashmetu')
    })
  ],
  factories: [
    ResourceFactory,
    RouterFactory,
    ProviderControllerFactory,
    RequestLoggerFactory,
  ],
})
export default class Tashmetu {}
