import mongo from 'mongodb';

export interface MongoDBCollectionConfig {
  collection: mongo.Collection;

  disableEvents?: boolean;
}
