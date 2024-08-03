import { storeResolvers } from "./storeResolvers.js";

export const resolvers = {
  Query: {
    ...storeResolvers.Query,
  },
  Mutation: {
    ...storeResolvers.Mutation,
  },
};
