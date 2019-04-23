import {provider} from '@ziggurat/tiamat';
import {Transformer} from '@ziggurat/common';

@provider({
  key: 'ziggurat.Transformer'
})
export class IdentityTransformer implements Transformer {
  public async toInstance<T>(plain: any, mode: string, defaultModel?: string): Promise<T> {
    return plain;
  }

  public async toPlain<T>(instance: T, mode: string, defaultModel?: string): Promise<any> {
    return instance;
  }
}

