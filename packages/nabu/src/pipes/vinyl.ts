import * as vfs from 'vinyl-fs';
import * as stream from 'stream';
import Vinyl from 'vinyl';
import {pipe} from 'pipeline-pipe';
import {StreamFactory, ObjectPipeTransformFactory, documentStream} from './util';
import {Pipe} from '@ziqquratu/pipe';

const pumpify = require('pumpify');

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

export const vinyl = ({adapter, transforms, id, path, onDelete}: VinylConfig) => documentStream({
  readable: () => pumpify.obj(
    adapter.createReadable(),
    pipe((file: Vinyl) => ({file, contents: file.contents})),
    ObjectPipeTransformFactory.inputPipeline(transforms, 'contents'),
    pipe(async ({file, contents}) => Object.assign(contents, {_id: await id(file)}))
  ),
  writable: () => pumpify.obj(
    pipe(doc => ({doc, contents: doc})),
    ObjectPipeTransformFactory.outputPipeline(transforms, 'contents'),
    pipe(async ({doc, contents}) => new Vinyl({path: await path(doc), contents})),
    adapter.createWritable(),
  ),
  onDelete: () => pipe(onDelete),
});

export const vinylFs = ({src, dest}: VinylFSConfig) => ({
  createReadable: () => vfs.src(src) as stream.Duplex,
  createWritable: () => vfs.dest(dest) as stream.Duplex,
}) as StreamFactory;
