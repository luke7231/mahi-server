import { likeResolvers } from "./like/likeResolvers.js";
import { storeResolvers } from "./storeResolvers.js";
import { userResolvers } from "./user/userResolvers.js";
import { tokenResolvers } from "./token/tokenResolvers.js";

export const resolvers = {
  Query: {
    ...storeResolvers.Query,
    ...userResolvers.Query,
  },
  Mutation: {
    ...storeResolvers.Mutation,
    ...userResolvers.Mutation,
    ...likeResolvers.Mutation,
    ...tokenResolvers.Mutation,
  },
  User: userResolvers.User,
  Store: storeResolvers.Store,
};
