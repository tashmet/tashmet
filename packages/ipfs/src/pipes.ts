import {filter, pipe, transformInput, transformOutput} from '@ziqquratu/nabu';
import {IOGate, Pipe} from '@ziqquratu/pipe';

function omitId(doc: any) {
  const clone = Object.assign({}, doc);
  delete clone._id;
  return clone;
}

export const ipfsReader = (transforms: IOGate<Pipe>[], id?: (file: any) => string) => [
  filter(async (file: any) => file.type === 'file'),
  pipe(async (file: any) => {
    const content = []
    for await (const chunk of file.content) {
      content.push(chunk)
    }
    return {file, content: Buffer.from(content.toString())}
  }),
  transformInput(transforms, 'content'),
  pipe(async ({file, content}) => id ? Object.assign(content, {_id: id(file)}) : content),
];


export const ipfsWriter = (transforms: IOGate<Pipe>[], path: (doc: any) => string) => [
  pipe(async doc => ({doc, content: omitId(doc)})),
  transformOutput(transforms, 'content'),
  pipe(async ({doc, content}) => ({path: path(doc), content: content.toString()})),
];
