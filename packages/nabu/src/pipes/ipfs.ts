/*
import {pipe} from 'pipeline-pipe';
import {DuplexTransformFactory} from '../interfaces';
import {chainInput, chainOutput} from './util';
import minimatch from 'minimatch';
import {omit} from 'lodash';
import { IOGate, Pipe } from '@ziqquratu/pipe';
*/

//const pumpify = require('pumpify');
//const filter = require('stream-filter');

//export interface IPFSReaderConfig {
  /** Transforms for modifying file contents */
  //transforms: IOGate<Pipe>[];

  /** A function to determine the ID of a document read */
  //id?: (file: any) => string; 
//}
/*
export const ipfsReader = ({transforms, id}: IPFSReaderConfig) =>
  chain([
    async (file: Vinyl) => ({file, contents: file.contents}),
    processKey(chainInput(transforms), 'contents'),
    async ({file, contents}) => id ? Object.assign(contents, {_id: id(file)}) : contents,
  ]);
  pumpify.obj(
    filter.obj((file: any) => file.type === 'file'),
    pipe(async (file: any) => {
      const content = []
      for await (const chunk of file.content) {
        content.push(chunk)
      }
      return {file, content: Buffer.from(content.toString())}
    }),
    chainInput(transforms, 'content'),
    pipe(async ({file, content}) => id ? Object.assign(content, {_id: id(file)}) : content)
  );
*/

// export interface IPFSWriterConfig {
  /** Transforms for modifying file contents */
  // transforms: IOGate<Pipe>[];

  /** A function returning the file path given a document on write */
  // path: (doc: any) => string;
//}
/*
export const ipfsWriter = ({transforms, path}: IPFSWriterConfig) =>
  pumpify.obj(
    pipe(doc => ({doc, content: omit(doc, ['_id'])})),
    chainOutput(transforms, 'content'),
    pipe(async ({doc, content}) => ({path: path(doc), content: content.toString()})),
  );

export interface IPFSTransformer extends IPFSReaderConfig, IPFSWriterConfig {}
*/