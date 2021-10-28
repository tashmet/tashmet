import {component, Logger, Provider} from '@tashmit/core';
import {QueryParser} from '@tashmit/qs-parser';
import http from 'http';
import SocketIO from 'socket.io';
import express from 'express';
import {ExpressServer} from './server';
import {SocketGateway} from './gateway';

export * from './controller';
export * from './decorators';
export * from './interfaces';
export * from './routers/resource';
export * from './logging';

@component({
  providers: [
    SocketGateway,
    ExpressServer,
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
      key: 'server.Logger',
      inject: [Logger],
      create: (logger: Logger) => logger.inScope('server')
    }),
    Provider.ofInstance(QueryParser, QueryParser.json()),
  ],
})
export default class ServerComponent {}
