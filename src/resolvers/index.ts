import { storeResolvers } from "./storeResolvers.js";
import { userResolvers } from "./user/userResolvers.js";
export const resolvers = {
  Query: {
    ...storeResolvers.Query,
    ...userResolvers.Query,
  },
  Mutation: {
    ...storeResolvers.Mutation,
    ...userResolvers.Mutation,
  },
};
