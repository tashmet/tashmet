import {Logger} from '@tashmet/core';
import {Collection, ChangeStreamDocument, Query, HashCode} from '@tashmet/database';
import {QueryParser} from '@tashmet/qs-parser';
import * as express from 'express';
import * as SocketIO from 'socket.io';
import * as url from 'url';
import {serializeError} from 'serialize-error';
import {get, post, put, del} from '../decorators';

function cacheOrEval<T>(records: Record<string, T>, hashCode: HashCode, value: any, fn: (value: any) => T) {
  const hash = hashCode(value);
  let result: T;
  if (hash) {
    result = records[hash];
    if (!result) {
      result = (records[hash] = fn(value));
    }
    return result;
  } else {
    return fn(value);
  }
}
export interface ResourceConfig {
  /** The name of the collection */
  collection: Collection;

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
    protected queryParser: QueryParser,
    protected hashCode: HashCode,
  ) {
    collection.watch().on('change', change => this.onChange(change));
  }

  private onChange(change: ChangeStreamDocument) {
    for (const socket of Object.values(this.connections)) {
      socket.emit('change', change);
    }
    const n = Object.keys(this.connections).length;
    this.logger.debug(
      `'${this.collection.collectionName}' emitted change '${change.operationType}' to '${n}' clients`
    );
  }

  public onConnection(socket: SocketIO.Socket) {
    this.connections[socket.id] = socket;
    this.logger.debug(`'${this.collection.collectionName}' added connection: '${socket.id}'`);

    socket.on('disconnect', msg => {
      delete this.connections[socket.id];
      this.logger.debug(`'${this.collection.collectionName}' removed connection: '${socket.id}' (${msg})`);
    });
  }

  public toString(): string {
    const access = this.readOnly ? 'read only' : 'read/write';
    return `resource using collection '${this.collection.collectionName}' (${access})`;
  }

  @get('/')
  public async getAll(req: express.Request, res: express.Response) {
    return this.formResponse(res, 200, false, async () => {
      const {filter, ...options} = cacheOrEval<Query>(this.queryCache, this.hashCode, req.url, () => {
        return this.queryParser.parse(url.parse(req.url).query || '')
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
      const result = await this.collection.deleteOne({_id: req.params.id});
      if (!result.acknowledged || result.deletedCount === 0) {
        res.statusCode = 204;
        res.send(result);
      }
      return result;
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
