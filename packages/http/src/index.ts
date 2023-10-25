import { Container, PluginConfigurator } from '@tashmet/core';
import { AggregatorFactory, op } from '@tashmet/engine';
import fetch from 'isomorphic-fetch';

export interface HttpConfig {

}

export class Http {
  @op.pipeline('$fetch')
  public async* fetch(it: AsyncIterable<Document>, expr: any, resolve: (doc: Document, expr: any) => any) {
    const { url, ...init } = expr;

    for await (const doc of it) {
      const resp = await fetch(resolve(doc, url), init);
      yield await resp.json();
    }
  }
}

export class HttpConfigurator extends PluginConfigurator<Http> {
  public load() {
    this.container
      .resolve(AggregatorFactory)
      .addOperatorController(new Http());
  }
}

export default (config?: HttpConfig) => (container: Container) => new HttpConfigurator(Http, container);
