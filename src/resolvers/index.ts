import { likeResolvers } from "./like/likeResolvers.js";
import { storeResolvers } from "./storeResolvers.js";
import { userResolvers } from "./user/userResolvers.js";
import { tokenResolvers } from "./token/tokenResolvers.js";
import { productResolvers } from "./product/productResolvers.js";
import { orderResolvers } from "./order/orderResolvers.js";
import { sellerResolvers } from "./seller/sellerResolvers.js";
import { menuResolvers } from "./menu/menuResolvers.js";
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";

export const resolvers = {
  Upload: GraphQLUpload, // Upload 타입 정의
  Query: {
    ...storeResolvers.Query,
    ...userResolvers.Query,
    ...productResolvers.Query,
    ...orderResolvers.Query,
    ...sellerResolvers.Query,
    ...menuResolvers.Query,
  },
  Mutation: {
    ...storeResolvers.Mutation,
    ...userResolvers.Mutation,
    ...likeResolvers.Mutation,
    ...tokenResolvers.Mutation,
    ...productResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...sellerResolvers.Mutation,
    ...menuResolvers.Mutation,
  },
  User: userResolvers.User,
  Store: storeResolvers.Store,
  Product: productResolvers.Product,
};
