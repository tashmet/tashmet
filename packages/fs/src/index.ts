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
  public constructor(public options: FileSystemOptions) {}

  @op.expression('$lstat')
  public lstat(obj: any, expr: any, ctx: OperatorContext) {
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
  public fileExists(obj: any, expr: any, ctx: OperatorContext) {
    return fs.existsSync(ctx.compute(obj, expr));
  }

  @op.expression('$readFile')
  public readFile(obj: any, expr: any, ctx: OperatorContext) {
    return fs.readFileSync(ctx.compute(obj, expr), 'utf-8');
  }

  @op.pipeline('$writeFile')
  public async *$writeFile(it: AsyncIterable<Document>, expr: any, ctx: OperatorContext) {
    let index = 0;

    for await (const doc of it) {
      const content = ctx.compute(doc, expr.content);
      const path = ctx.compute(doc, expr.to);
      const overwrite = ctx.compute(doc, expr.overwrite);

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
  public async* $glob(it: AsyncIterable<Document>, args: any, ctx: OperatorContext) {
    const { pattern } = args;

    for await (const doc of it) {
      const files = await glob.glob(ctx.compute(doc, pattern));
      for (const file of files) {
        yield { _id: file };
      }
    }
  }

  @op.expression('$globMatch')
  public globMatch(obj: any, expr: any, ctx: OperatorContext) {
    return globToRegExp(expr.pattern, {extended: true}).test(ctx.compute(obj, expr.input));
  }

  @op.expression('$basename')
  public basename(obj: any, expr: any, ctx: OperatorContext) {
    if (Array.isArray(expr)) {
      return nodePath.basename(ctx.compute(obj, expr[0]), ctx.compute(obj, expr[1]));
    }
    return nodePath.basename(ctx.compute(obj, expr));
  }

  @op.expression('$extname')
  public extname(obj: any, expr: any, ctx: OperatorContext) {
    return nodePath.extname(ctx.compute(obj, expr));
  };

  @op.expression('$dirname')
  public dirname(obj: any, expr: any, ctx: OperatorContext) {
    return nodePath.dirname(ctx.compute(obj, expr));
  };

  @op.expression('$relativePath')
  public relativePath(obj: any, expr: string[], ctx: OperatorContext) {
    return nodePath.relative(ctx.compute(obj, expr[0]), ctx.compute(obj, expr[1]));
  };

  @op.expression('$joinPaths')
  public joinPaths(obj: any, expr: any[], ctx: OperatorContext) {
    return nodePath.join(...expr.map(e => ctx.compute(obj, e)));
  };
}

export default (options: FileSystemOptions = {}) => (container: Container) =>
  new OperatorPluginConfigurator(FileSystem, container)
    .provide(Provider.ofInstance(FileSystemOptions, options));
