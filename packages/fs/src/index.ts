import fs from 'fs';
import * as nodePath from 'path';
import * as glob from 'glob';
export * from './interfaces.js';

import { Document } from '@tashmet/tashmet';
import { FileSystemOptions } from './interfaces.js';
import { Container, provider, Provider } from '@tashmet/core';
import { op, OperatorContext, OperatorPluginConfigurator } from '@tashmet/engine';
import globToRegExp from 'glob-to-regexp';

@provider()
export class FileSystem {
  constructor(public options: FileSystemOptions) {}

  @op.expression('$lstat')
  lstat(obj: any, expr: any, ctx: OperatorContext) {
    const res: fs.Stats = fs.lstatSync(ctx.compute(obj, expr));
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

  @op.expression('$fileExists')
  fileExists(obj: any, expr: any, ctx: OperatorContext) {
    return fs.existsSync(ctx.compute(obj, expr));
  }

  @op.expression('$readFile')
  readFile(obj: any, expr: any, ctx: OperatorContext) {
    return fs.readFileSync(ctx.compute(obj, expr), 'utf-8');
  }

  @op.pipeline('$writeFile')
  async *$writeFile(it: AsyncIterable<Document>, expr: any, ctx: OperatorContext) {
    let i = 0;

    for await (const doc of it) {
      const { content, to: path, overwrite, ordered, index } = ctx.compute(doc, expr);

      if (!overwrite && fs.existsSync(path)) {
        yield {
          errMsg: `Trying to overwrite file: ${path} with overwrite flag set to false`,
          index: index || i,
        };
        if (ordered) {
          return;
        }
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

      i++;
    }
  }

  @op.pipeline('$glob')
  async* $glob(it: AsyncIterable<Document>, args: any, ctx: OperatorContext) {
    const { pattern } = args;

    for await (const doc of it) {
      const files = await glob.glob(ctx.compute(doc, pattern));
      for (const file of files) {
        yield { _id: file };
      }
    }
  }

  @op.expression('$globMatch')
  globMatch(obj: any, expr: any, ctx: OperatorContext) {
    return globToRegExp(expr.pattern, {extended: true}).test(ctx.compute(obj, expr.input));
  }

  @op.expression('$basename')
  basename(obj: any, expr: any, ctx: OperatorContext) {
    if (Array.isArray(expr)) {
      return nodePath.basename(ctx.compute(obj, expr[0]), ctx.compute(obj, expr[1]));
    }
    return nodePath.basename(ctx.compute(obj, expr));
  }

  @op.expression('$extname')
  extname(obj: any, expr: any, ctx: OperatorContext) {
    return nodePath.extname(ctx.compute(obj, expr));
  }

  @op.expression('$dirname')
  dirname(obj: any, expr: any, ctx: OperatorContext) {
    return nodePath.dirname(ctx.compute(obj, expr));
  }

  @op.expression('$relativePath')
  relativePath(obj: any, expr: string[], ctx: OperatorContext) {
    return nodePath.relative(ctx.compute(obj, expr[0]), ctx.compute(obj, expr[1]));
  }

  @op.expression('$joinPaths')
  joinPaths(obj: any, expr: any[], ctx: OperatorContext) {
    return nodePath.join(...expr.map(e => ctx.compute(obj, e)));
  }
}

export default (options: FileSystemOptions = {}) => (container: Container) =>
  new OperatorPluginConfigurator(FileSystem, container)
    .provide(Provider.ofInstance(FileSystemOptions, options));
