import {File} from '../interfaces';
import {pipe, Transform} from './util';

export const fileReader: Transform<File> = pipe<File>(async file => {
  let res = file.content;

  if (file.content) {
    const content = []
    for await (const chunk of file.content) {
      content.push(chunk);
    }
    res = Buffer.from(content.toString());
  }
  return {...file, content: res};
});
