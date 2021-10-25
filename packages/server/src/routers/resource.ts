import {Factory, Logger} from '@tashmit/core';
import {Collection, Database, DatabaseChange, Query} from '@tashmit/database';
import * as express from 'express';
import * as SocketIO from 'socket.io';
import * as url from 'url';
import {serializeError} from 'serialize-error';
import {get, post, put, del} from '../decorators';
import {router, ControllerFactory} from '../controller';
import {QueryParser, cacheOrEval} from '../query/common';
import {jsonQueryParser} from '../query/json';

export interface ResourceConfig {
  /** The name of the collection */
  collection: string;

  /**
   * If set, the resource will be in read-only mode meaning that only GET
   * requests will be allowed.
   *
   * @default false
   */
  readOnly?: boolean;

  /**
   * Optional custom function that forms a find query from the request.
   */
  queryParser?: QueryParser;
}


export class Resource {
  private connections: Record<string, SocketIO.Socket> = {};
  private queryCache: Record<string, Query> = {};

  public constructor(
    protected collection: Collection,
    protected logger: Logger,
    protected readOnly = false,
    protected queryParser: QueryParser = jsonQueryParser(),
  ) {
    this.collection.on('change', change => this.onChange(change));
    this.collection.on('error', err => this.onError(err));
  }

  private onChange({action, data}: DatabaseChange) {
    for (const socket of Object.values(this.connections)) {
      socket.emit('change', {action, data});
    }
    const n = Object.keys(this.connections).length;
    this.logger.debug(
      `'${this.collection.name}' emitted change "${action}" '${data.map(d => d._id).join(',')}' to '${n}' clients`
    );
  }

  private onError(err: Error) {
    for (const socket of Object.values(this.connections)) {
      socket.emit('error', err);
    }
    const n = Object.keys(this.connections).length;
    this.logger.debug(
      `'${this.collection.name}' emitted error '${err.message}' to '${n}' clients`
    );
  }

  public onConnection(socket: SocketIO.Socket) {
    this.connections[socket.id] = socket;
    this.logger.debug(`'${this.collection.name}' added connection: '${socket.id}'`);

    socket.on('disconnect', msg => {
      delete this.connections[socket.id];
      this.logger.debug(`'${this.collection.name}' removed connection: '${socket.id}' (${msg})`);
    });
  }

  public toString(): string {
    const access = this.readOnly ? 'read only' : 'read/write';
    return `resource using collection '${this.collection.name}' (${access})`;
  }

  @get('/')
  public async getAll(req: express.Request, res: express.Response) {
    return this.formResponse(res, 200, false, async () => {
      const {filter, ...options} = cacheOrEval<Query>(this.queryCache, req.url, () => {
        return this.queryParser(url.parse(req.url).query || '')
      });
      const count = await this.collection.find(filter).count(false);

      res.setHeader('X-total-count', count.toString());
      return this.collection.find(filter, options).toArray();
    });
  }

  @get('/:id')
  public async getOne(req: express.Request, res: express.Response) {
    return this.formResponse(res, 200, false, async () => {
      const doc = await this.collection.findOne({_id: req.params.id});
      if (!doc) {
        res.statusCode = 404;
        res.send(null);
      }
      return doc;
    });
  }

  @post('/', express.json())
  public async postOne(req: express.Request, res: express.Response) {
    return this.formResponse(res, 201, true, async () => {
      return this.collection.insertOne(req.body);
    });
  }

  @put('/:id', express.json())
  public async putOne(req: express.Request, res: express.Response) {
    return this.formResponse(res, 200, true, async () => {
      return this.collection.replaceOne({_id: req.params.id}, req.body);
    });
  }

  @del('/:id', express.json())
  public async deleteOne(req: express.Request, res: express.Response) {
    return this.formResponse(res, 200, true, async () => {
      const doc = await this.collection.deleteOne({_id: req.params.id});
      if (!doc) {
        res.statusCode = 204;
        res.send(null);
      }
      return doc;
    });
  }

  private async formResponse(
    res: express.Response, statusCode: number, write: boolean, fn: () => Promise<any>
  ) {
    res.setHeader('Content-Type', 'application/json');

    if (this.readOnly && write) {
      res.statusCode = 403;
      return serializeError(new Error('Resource is read only'));
    }
    try {
      res.statusCode = statusCode;
      return await fn();
    } catch (err) {
      res.statusCode = 500;
      return serializeError(err);
    }
  }
}

/**
 * Create a resource request handler.
 *
 * This function creates a router that interacts with a Ziggurat database collection.
 */
export const resource = (config: ResourceConfig) =>
  router(Factory.of(async ({container}) => {
    const database = container.resolve(Database);
    const logger = container.resolve(Logger.inScope('server'));

    return new Resource(
      await database.collection(config.collection),
      logger.inScope('Resource'),
      config.readOnly,
      config.queryParser,
    );
  }));
