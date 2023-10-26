import fs from 'fs';
import * as nodePath from 'path';
import { glob } from 'glob';
export * from './interfaces.js';

import { Document } from '@tashmet/tashmet';
import { FileSystemOptions } from './interfaces.js';
import { Container, provider, Provider } from '@tashmet/core';
import { op, OperatorPluginConfigurator } from '@tashmet/engine';
import globToRegExp from 'glob-to-regexp';

@provider()
export class FileSystem {
  public constructor(public options: FileSystemOptions) {}

  @op.expression('$lstat')
  public lstat(expr: any, resolve: (expr: any) => any) {
    const res: fs.Stats = fs.lstatSync(resolve(expr));
    return {
      ...res,
      isBlockDevice: res.isBlockDevice(),
      isCharacterDevice: res.isCharacterDevice(),
      isDirectory: res.isDirectory(),
      isFIFO: res.isFIFO(),
      isFile: res.isFile(),
      isSocket: res.isSocket(),
      isSymbolicLink: res.isSymbolicLink(),
    };
  }

  @op.expression('$readFile')
  public readFile(expr: any, resolve: (expr: any) => any) {
    return fs.readFileSync(resolve(expr), 'utf-8');
  }

  @op.pipeline('$writeFile')
  public async *$writeFile(it: AsyncIterable<Document>, expr: any, resolve: any) {
    let index = 0;

    for await (const doc of it) {
      const content = resolve(doc, expr.content);
      const path = resolve(doc, expr.to);
      const overwrite = resolve(doc, expr.overwrite);

      if (!overwrite && fs.existsSync(path)) {
        yield {
          errMsg: `Trying to overwrite file: ${path} with overwrite flag set to false`,
          index
        };
      }

      if (content) {
        const dir = nodePath.dirname(path);

        if (!fs.existsSync(dir))  {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(path, Buffer.from(content));
      } else {
        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
        }
      }

      index++;
    }
  }

  @op.pipeline('$glob')
  public async* $glob(it: AsyncIterable<Document>, args: any, resolve: (doc: Document, expr: any) => any) {
    const { pattern } = args;

    for await (const doc of it) {
      const files = await glob(resolve(doc, pattern));
      for (const file of files) {
        yield { _id: file };
      }
    }
  }

  @op.expression('$globMatch')
  public globMatch(expr: any, resolve: (expr: any) => any) {
    return globToRegExp(expr.pattern, {extended: true}).test(resolve(expr.input));
  }

  @op.expression('$basename')
  public basename(expr: any, resolve: (expr: any) => any) {
    if (Array.isArray(expr)) {
      return nodePath.basename(resolve(expr[0]), resolve(expr[1]));
    }
    return nodePath.basename(resolve(expr));
  }

  @op.expression('$extname')
  public extname(expr: any, resolve: (expr: any) => any) {
    return nodePath.extname(resolve(expr));
  };
}

export default (options: FileSystemOptions = {}) => (container: Container) =>
  new OperatorPluginConfigurator(FileSystem, container)
    .provide(Provider.ofInstance(FileSystemOptions, options));
