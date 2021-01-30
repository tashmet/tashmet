import * as vfs from 'vinyl-fs';
import Vinyl from 'vinyl';
import * as stream from 'stream';
import {pipe} from 'pipeline-pipe';
import {StreamFactory, ObjectPipeTransformFactory} from './util';
import {Pipe} from '@ziqquratu/pipe';
const pumpify = require('pumpify');

const ternaryStream = require('ternary-stream');

const documentWrite = (writeStream: stream.Writable, deleteStream: stream.Writable): stream.Writable =>
  ternaryStream((doc: any) => !doc._delete, writeStream, deleteStream);

export class VinylObjectStreamFactory implements StreamFactory {
  public constructor(
    private adapter: StreamFactory,
    private transforms: ObjectPipeTransformFactory[],
    private toId: Pipe<Vinyl, string>,
    private toPath: Pipe<any, string>,
    private deletePipe: Pipe,
  ) {}

  public createReadable() {
    const transforms = ObjectPipeTransformFactory.inputPipeline(this.transforms, 'contents');
    const splitContents = pipe((file: Vinyl) => ({file, contents: file.contents}));
    const assignId = pipe(async ({file, contents}) => Object.assign(contents, {_id: await this.toId(file)}));

    return pumpify.obj(this.adapter.createReadable(), splitContents, transforms, assignId);
  }

  public createWritable() {
    const transforms = ObjectPipeTransformFactory.outputPipeline(this.transforms, 'contents');
    const splitContents = pipe(doc => ({doc, contents: doc}));
    const createVinyl = pipe(async ({doc, contents}) => new Vinyl({path: await this.toPath(doc), contents}));

    return documentWrite(
      pumpify.obj(splitContents, transforms, createVinyl, this.adapter.createWritable()),
      pipe(this.deletePipe)
    );
  }
}

export class VinylFSStreamFactory implements StreamFactory {
  public constructor(
    private src: string | string[],
    private dest: string,
  ) {}

  public createReadable() {
    return vfs.src(this.src) as stream.Duplex;
  }

  public createWritable() {
    return vfs.dest(this.dest) as stream.Duplex;
  }
}

export interface VinylConfig {
  adapter: StreamFactory;
  transforms: ObjectPipeTransformFactory[];
  id: Pipe<Vinyl, string>;
  path: Pipe<any, string>;
  onDelete: Pipe;
}

export interface VinylFSConfig {
  src: string | string[];
  dest: string;
}

export const vinyl = ({adapter, transforms, id, path, onDelete}: VinylConfig) =>
  new VinylObjectStreamFactory(adapter, transforms, id, path, onDelete);

export const vinylFs = ({src, dest}: VinylFSConfig) => new VinylFSStreamFactory(src, dest);
