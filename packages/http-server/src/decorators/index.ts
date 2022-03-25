import {RequestHandler} from 'express';
import {classDecorator, methodDecorator} from '@tashmet/core';
import {RouteMap, RouteMethod, Middleware} from '../interfaces';
import {RouterMethodAnnotation} from './method';
import {MiddlewareAnnotation} from './middleware';

/**
 * Router-level middleware.
 *
 * This decorator can be used to attach middleware to a router by decorating its class.
 *
 * @usageNotes
 *
 * The decorator accepts a map of middleware.
 *
 * The following example shows how to mount a middleware for serving static files.
 *
 * ```typescript
 * @middleware({
 *   '/static': express.static('public')
 * })
 * ```
 */
export const middleware = (config: RouteMap) =>
  classDecorator(() => new MiddlewareAnnotation(config));

export const method = (name: RouteMethod, path: string, ...mw: Middleware[]) =>
  methodDecorator<RequestHandler>(({propertyKey}) =>
    new RouterMethodAnnotation(name, path, mw, propertyKey));

/** HTTP GET request handler. */
export const get = (path: string, ...mw: Middleware[]) =>
  method('get', path, ...mw);

/** HTTP POST request handler. */
export const post = (path: string, ...mw: Middleware[]) =>
  method('post', path, ...mw);

/** HTTP PUT request handler. */
export const put = (path: string, ...mw: Middleware[]) =>
  method('put', path, ...mw);

/** HTTP PATCH request handler. */
export const patch = (path: string, ...mw: Middleware[]) =>
  method('patch', path, ...mw);

/** HTTP DELETE request handler. */
export const del = (path: string, ...mw: Middleware[]) =>
  method('delete', path, ...mw);
