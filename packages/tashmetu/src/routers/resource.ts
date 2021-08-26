import {Collection, Database, Logger, QueryOptions} from '@ziqquratu/ziqquratu';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as SocketIO from 'socket.io';
import {serializeError} from 'serialize-error';
import {get, post, put, del} from '../decorators';
import {router, ControllerFactory} from '../controller';

export type RequestToFind = (req: express.Request, fn: (selector: any, options: QueryOptions) => void) => void;

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
  find?: RequestToFind;
}

function parseJson(input: any): Record<string, any> {
  try {
    return JSON.parse(input);
  } catch (e) {
    return {};
  }
}

export const defaultFind: RequestToFind = (req, fn) => {
  const { selector, sort, skip, limit } = req.query;
  const options: QueryOptions = {};

  if (sort) {
    options.sort = parseJson(sort);
  }
  if (skip) {
    options.skip = parseInt(skip as string);
  }
  if (limit) {
    options.limit = parseInt(limit as string);
  }

  fn(parseJson(selector), options);
}

export class Resource {
  private connections: Record<string, SocketIO.Socket> = {};

  public constructor(
    protected collection: Collection,
    protected logger: Logger,
    protected readOnly = false,
    protected find: RequestToFind = defaultFind,
  ) {
    this.collection.on('document-upserted', doc => this.onDocumentUpserted(doc));
    this.collection.on('document-removed', doc => this.onDocumentRemoved(doc));
    this.collection.on('document-error', err => this.onDocumentError(err));
  }

  private onDocumentUpserted(doc: any) {
    for (const socket of Object.values(this.connections)) {
      socket.emit('document-upserted', doc, this.collection.name);
    }
    const n = Object.keys(this.connections).length;
    this.logger.debug(
      `'${this.collection.name}' emitted document-upserted '${doc._id}' to '${n}' clients`
    );
  }

  private onDocumentRemoved(doc: any) {
    for (const socket of Object.values(this.connections)) {
      socket.emit('document-removed', doc, this.collection.name);
    }
    const n = Object.keys(this.connections).length;
    this.logger.debug(
      `'${this.collection.name}' emitted document-removed '${doc._id}' to '${n}' clients`
    );
  }

  private onDocumentError(err: Error) {
    for (const socket of Object.values(this.connections)) {
      socket.emit('document-error', err, this.collection.name);
    }
    const n = Object.keys(this.connections).length;
    this.logger.debug(
      `'${this.collection.name}' emitted document-error '${err.message}' to '${n}' clients`
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
      return new Promise((resolve, reject) => {
        this.find(req, async (selector, options) => {
          try {
            const count = await this.collection.find(selector).count(false);

            res.setHeader('X-total-count', count.toString());
            resolve(this.collection.find(selector, options).toArray());
          } catch (err) {
            reject(err);
          }
        })
      });
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

  @post('/', bodyParser.json())
  public async postOne(req: express.Request, res: express.Response) {
    return this.formResponse(res, 201, true, async () => {
      return this.collection.insertOne(req.body);
    });
  }

  @put('/:id', bodyParser.json())
  public async putOne(req: express.Request, res: express.Response) {
    return this.formResponse(res, 200, true, async () => {
      return this.collection.replaceOne({_id: req.params.id}, req.body);
    });
  }

  @del('/:id', bodyParser.json())
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

export class ResourceFactory extends ControllerFactory {
  constructor(private config: ResourceConfig) {
    super(Database, 'tashmetu.Logger');
  }

  public create(): Promise<any> {
    return this.resolve(async (db: Database, logger: Logger) => {
      return new Resource(
        await db.collection(this.config.collection),
        logger.inScope('Resource'),
        this.config.readOnly,
        this.config.find,
      );
    });
  }
}

/**
 * Create a resource request handler.
 *
 * This function creates a router that interacts with a Ziggurat database collection.
 */
export const resource = (config: ResourceConfig) => router(new ResourceFactory(config));
