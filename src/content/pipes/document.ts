import {Pipe} from '../interfaces';
import {DocumentController} from '../document';

export class DocumentPipe implements Pipe {
  private documents: {[name: string]: DocumentController} = {};

  public constructor(private action: string) {}

  public addController(doc: DocumentController) {
    this.documents[doc.name] = doc;
  }

  public process(input: any, next: (output: any) => void): void {
    let document = this.documents[input._id];
    if (document) {
      document.getPipeline(this.action).process(input, next);
    } else {
      next(input);
    }
  }
}
