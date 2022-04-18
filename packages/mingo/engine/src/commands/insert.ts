import ObjectID from 'bson-objectid';
import { Document } from '../interfaces';
import { MingoCommandHandler } from '../command';

export class InsertCommandHandler extends MingoCommandHandler {
  public async execute({insert: coll, documents, ordered}: Document) {
    let writeErrors: any[] = [];
    let n=0;

    for (let i=0; i<documents.length; i++) {
      let error;

      if (!documents[i].hasOwnProperty('_id')) {
        documents[i]._id = new ObjectID().toHexString();
      } else if (this.store.index(coll, documents[i]._id) !== undefined) {
        error = {index: i, errMsg: 'Duplicate key error'};
      }

      if (error === undefined) {
        this.store.insert(coll, documents[i]);
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
