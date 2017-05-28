import {Pipe} from '../interfaces';
import {DocumentController} from '../controllers/document';
import * as Promise from 'bluebird';

export class DocumentPipe implements Pipe {
  private documents: {[name: string]: DocumentController} = {};

  public constructor(private action: string) {}

  public addController(doc: DocumentController) {
    this.documents[doc.name] = doc;
  }

  public process(input: any): Promise<any> {
    let document = this.documents[input._id];
    if (document) {
      return document.getPipeline(this.action).process(input);
    } else {
      return Promise.resolve(input);
    }
  }
}
