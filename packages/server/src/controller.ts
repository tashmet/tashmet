import * as express from 'express';
import {AsyncFactory, Factory, Logger, ServiceRequest} from '@tashmit/core';
import {RequestHandlerFactory, Route} from './interfaces';
import {SocketGateway} from './gateway';
import {RouterAnnotation} from './decorators/middleware';
import {mountRoutes} from './routing';

export function controllerName(ctr: any): string {
  return typeof ctr.toString === 'function' ? ctr.toString() : ctr.constructor.name;
}

export type ControllerFactory = AsyncFactory<any>;

/**
 * Create a request handler factory from a controller provider or controller factory.
 *
 * This function allows us to turn a controller into a mountable request handler.
 *
 * @param controller A provider of or factory of a controller.
 */
export function router(factOrProvider: ServiceRequest<any> | ControllerFactory): RequestHandlerFactory {
  return Factory.of(async ({path, container}) => {
    const controller = factOrProvider instanceof Factory
      ? await factOrProvider.resolve(container)({})
      : container.resolve(factOrProvider);
    const logger = container.resolve(Logger.inScope('server.RouterFactory'));
    const gateway = container.resolve(SocketGateway);

    logger.info(`'${path}' as ${controllerName(controller)}`);
    let routes: Route[] = [];

    for (const annotation of RouterAnnotation.onClass(controller.constructor, true)) {
      routes = routes.concat(annotation.routes(controller));
    }
    for (const route of routes) {
      logger.info(`  - ${route.method}\t'${route.path}'`);
    }
    gateway.register(controller, {namespace: path});

    return mountRoutes(express.Router(), container, ...routes);
  });
};
