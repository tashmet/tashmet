import fs from 'fs';
import * as nodePath from 'path';
export * from './interfaces.js';

import { Container } from '@tashmet/tashmet';
import { FileSystemConfig } from './interfaces.js';
import { BootstrapConfig, plugin, PluginConfigurator } from '@tashmet/core';
import { AggregatorFactory } from '@tashmet/engine';


@plugin<FileSystemConfig>()
export default class FileSystem {
  public static configure(config: Partial<BootstrapConfig> & FileSystemConfig, container?: Container) {
    return new FileSystemConfigurator(FileSystem, config, container);
  }
}

export class FileSystemConfigurator extends PluginConfigurator<FileSystem, FileSystemConfig> {
  public load() {
    const aggFact = this.container.resolve(AggregatorFactory);

    async function *$write(it: AsyncIterable<Document>, expr: any, resolve: any) {
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

    aggFact.addPipelineOperator('$writeFile', $write);

    aggFact.addExpressionOperator('$lstat', (args, resolve) => {
      const res: fs.Stats = fs.lstatSync(resolve(args));
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
    });

    aggFact.addExpressionOperator('$readFile', (args, resolve) => {
      return fs.readFileSync(resolve(args), 'utf-8');
    });
  }
}