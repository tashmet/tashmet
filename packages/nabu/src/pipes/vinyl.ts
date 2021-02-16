import * as fs from 'fs';
import * as stream from 'stream';
import Vinyl from 'vinyl';
import {omit} from 'lodash';
import {transformInput, transformOutput, pipe, makeGenerator, Transform} from './util';
import * as chokidar from 'chokidar';
import * as vfs from 'vinyl-fs';
import minimatch from 'minimatch';
import { IOGate, Pipe } from '@ziqquratu/pipe';

export interface VinylReaderConfig {
  /** Transforms for modifying file contents */
  transforms: IOGate<Pipe>[];

  /** A function to determine the ID of a document read */
  id?: (file: Vinyl) => string; 
}

export const vinylReader = ({transforms, id}: VinylReaderConfig) => [
  pipe(async (file: Vinyl) => ({file, contents: file.contents})),
  transformInput(transforms, 'contents'),
  pipe(async ({file, contents}) => id ? Object.assign(contents, {_id: id(file)}) : contents),
];

export const vinylContents: Transform = pipe<Vinyl>(async file => file.contents);

export interface VinylWriterConfig {
  /** Transforms for modifying file contents */
  transforms: IOGate<Pipe>[];

  /** A function returning the file path given a document on write */
  path: (doc: any) => string;
}

export const vinylWriter = ({transforms, path}: VinylWriterConfig) => [
  pipe(async doc => ({doc, contents: omit(doc, ['_id'])})),
  transformOutput(transforms, 'contents'),
  pipe(async ({doc, contents}) => new Vinyl({path: path(doc), contents})),
];

export interface VinylTransformer extends VinylReaderConfig, VinylWriterConfig {}
