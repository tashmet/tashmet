import * as vfs from 'vinyl-fs';
import * as stream from 'stream';
import Vinyl from 'vinyl';
import {pipe} from 'pipeline-pipe';
import {StreamFactory, chainInput, chainOutput, DuplexTransformFactory} from './util';
import {Pipe} from '@ziqquratu/pipe';

const pumpify = require('pumpify');

export interface VinylConfig {
  adapter: StreamFactory;
  transforms: DuplexTransformFactory[];
  id: Pipe<Vinyl, string>;
  path: Pipe<any, string>;
}

export interface VinylFSConfig {
  src: string | string[];
  dest: string;
}

export const vinyl = ({adapter, transforms, id, path}: VinylConfig) => ({
  createReadable: () => pumpify.obj(
    adapter.createReadable(),
    pipe((file: Vinyl) => ({file, contents: file.contents})),
    chainInput(transforms, 'contents'),
    pipe(async ({file, contents}) => Object.assign(contents, {_id: await id(file)}))
  ),
  createWritable: () => pumpify.obj(
    pipe(doc => ({doc, contents: doc})),
    chainOutput(transforms, 'contents'),
    pipe(async ({doc, contents}) => new Vinyl({path: await path(doc), contents})),
    adapter.createWritable(),
  ),
}) as StreamFactory;

export const vinylFs = ({src, dest}: VinylFSConfig) => ({
  createReadable: () => vfs.src(src) as stream.Duplex,
  createWritable: () => vfs.dest(dest) as stream.Duplex,
}) as StreamFactory;
