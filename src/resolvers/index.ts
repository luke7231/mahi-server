import { likeResolvers } from "./like/likeResolvers.js";
import { storeResolvers } from "./storeResolvers.js";
import { userResolvers } from "./user/userResolvers.js";
import { tokenResolvers } from "./token/tokenResolvers.js";
import { productResolvers } from "./product/productResolvers.js";
import { orderResolvers } from "./order/orderResolvers.js";
export const resolvers = {
  Query: {
    ...storeResolvers.Query,
    ...userResolvers.Query,
    ...productResolvers.Query,
    ...orderResolvers.Query,
  },
  Mutation: {
    ...storeResolvers.Mutation,
    ...userResolvers.Mutation,
    ...likeResolvers.Mutation,
    ...tokenResolvers.Mutation,
    ...productResolvers.Mutation,
    ...orderResolvers.Mutation,
  },
  User: userResolvers.User,
  Store: storeResolvers.Store,
  Product: productResolvers.Product,
};
