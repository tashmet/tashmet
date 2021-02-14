import {pipe} from 'pipeline-pipe';
import {DuplexTransformFactory} from '../interfaces';
import {chainInput, chainOutput} from './util';
import minimatch from 'minimatch';

const pumpify = require('pumpify');
const filter = require('stream-filter');

export interface IPFSReaderConfig {
  /** Transforms for modifying file contents */
  transforms: DuplexTransformFactory[];

  /** A function to determine the ID of a document read */
  id?: (file: any) => string; 
}

export const ipfsReader = ({transforms, id}: IPFSReaderConfig) =>
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
