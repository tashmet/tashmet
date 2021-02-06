import * as fs from 'fs';
import * as stream from 'stream';
import Vinyl from 'vinyl';
import {pipe} from 'pipeline-pipe';
import {omit} from 'lodash';
import {DuplexTransformFactory} from '../interfaces';
import {chainInput, chainOutput} from './util';
import * as chokidar from 'chokidar';
import minimatch from 'minimatch';

const pumpify = require('pumpify');

export interface VinylFSWatcherConfig {
  glob: string | string[];

  watcher: chokidar.FSWatcher;

  events: string[];
}

export const vinylFSWatcher = ({glob, watcher, events}: VinylFSWatcherConfig) => {
  const readable = new stream.Readable({
    objectMode: true,
    read() { return; }
  });

  const onChange = (path: string, event: string) => {
    for (const pattern of Array.isArray(glob) ? glob : [glob]) {
      if (minimatch(path, pattern)) {
        const contents = event === 'unlink'
          ? stream.Readable.from([Buffer.from('{}')])
          : fs.readFileSync(path);

        readable.push(new Vinyl({path: path, contents}))
      }
    }
  }

  for (const ev of events) {
    watcher.on(ev, path => onChange(path, ev));
  }

  return readable;
}


export interface VinylReaderConfig {
  source: stream.Readable;

  /** Transforms for modifying file contents */
  transforms: DuplexTransformFactory[];

  /** A function to determine the ID of a document read */
  id?: (file: Vinyl) => string; 
}

export const vinylReader = ({source, transforms, id}: VinylReaderConfig) =>
  pumpify.obj(
    source,
    pipe((file: Vinyl) => ({file, contents: file.contents})),
    chainInput(transforms, 'contents'),
    pipe(async ({file, contents}) => id ? Object.assign(contents, {_id: id(file)}) : contents)
  );


export interface VinylWriterConfig {
  destination: stream.Writable;

  /** Transforms for modifying file contents */
  transforms: DuplexTransformFactory[];

  /** A function returning the file path given a document on write */
  path: (doc: any) => string;
}

export const vinylWriter = ({destination, transforms, path}: VinylWriterConfig) =>
  pumpify.obj(
    pipe(doc => ({doc, contents: omit(doc, ['_id'])})),
    chainOutput(transforms, 'contents'),
    pipe(async ({doc, contents}) => new Vinyl({path: path(doc), contents})),
    destination
  );
