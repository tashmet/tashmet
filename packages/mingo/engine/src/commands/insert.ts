import ObjectID from 'bson-objectid';
import { Document, DatabaseCommandHandler } from '../interfaces';

export const $insert: DatabaseCommandHandler = async (engine, {insert: coll, documents, ordered}: Document) => {
  let writeErrors: any[] = [];
  let n = 0;

  for (let i = 0; i < documents.length; i++) {
    let error;

    if (!documents[i].hasOwnProperty('_id')) {
      documents[i]._id = new ObjectID().toHexString();
    } else if (engine.store.index(coll, documents[i]._id) !== undefined) {
      error = {index: i, errMsg: 'Duplicate key error'};
    }

    if (error === undefined) {
      engine.store.insert(coll, documents[i]);
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
