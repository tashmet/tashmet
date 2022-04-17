import ObjectID from 'bson-objectid';
import {Document} from '@tashmet/tashmet';
import {MingoCommandHandler} from '../command';

export class InsertCommandHandler extends MingoCommandHandler {
  public execute({insert: coll, documents, ordered}: Document) {
    let writeErrors: any[] = [];
    let n=0;

    for (let i=0; i<documents.length; i++) {
      let error;

      if (!documents[i].hasOwnProperty('_id')) {
        documents[i]._id = new ObjectID().toHexString();
      } else if (this.store.indexOf(coll, documents[i]) >= 0) {
        error = {index: i, errMsg: 'Duplicate key error'};
      }

      if (error === undefined) {
        this.store.collections[coll].push(documents[i]);
        n++;
      } else {
        writeErrors.push(error);
        if (ordered) {
          break;
        }
      }
    }
    return writeErrors.length === 0 
      ? {n, ok: 1}
      : {n, ok: 1, writeErrors}
  }
}
