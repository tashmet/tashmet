import * as vfs from 'vinyl-fs';
import * as stream from 'stream';
import Vinyl from 'vinyl';
import {pipe} from 'pipeline-pipe';
import {StreamFactory, chainInput, chainOutput, DuplexTransformFactory} from './util';

const pumpify = require('pumpify');

/** Configuration for a Vinyl stream */
export interface VinylConfig {
  /** A vinyl adapter */
  adapter: StreamFactory;

  /** Transforms for modifying file contents */
  transforms: DuplexTransformFactory[];

  /** A function to determine the ID of a document read */
  id: (file: Vinyl) => string; 

  /** A function returning the file path given a document on write */
  path: (doc: any) => string;
}

export const vinyl = ({adapter, transforms, id, path}: VinylConfig) => ({
  createReadable: () => pumpify.obj(
    adapter.createReadable(),
    pipe((file: Vinyl) => ({file, contents: file.contents})),
    chainInput(transforms, 'contents'),
    pipe(async ({file, contents}) => Object.assign(contents, {_id: id(file)}))
  ),
  createWritable: () => pumpify.obj(
    pipe(doc => ({doc, contents: doc})),
    chainOutput(transforms, 'contents'),
    pipe(async ({doc, contents}) => new Vinyl({path: path(doc), contents})),
    adapter.createWritable(),
  ),
}) as StreamFactory;


/** Configuration for Vinyl FS adapter */
export interface VinylFSConfig {
  /** Source given as a glob string or an array of glob strings */
  src: string | string[];

  /** Destination folder path */
  dest: string;
}

export const vinylFs = ({src, dest}: VinylFSConfig) => ({
  createReadable: () => vfs.src(src) as stream.Duplex,
  createWritable: () => vfs.dest(dest) as stream.Duplex,
}) as StreamFactory;
