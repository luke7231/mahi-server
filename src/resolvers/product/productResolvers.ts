import { Store } from "@prisma/client";
import { prisma } from "../../index.js";

import { Expo } from "expo-server-sdk";

export const productResolvers = {
  Query: {
    products: async (_, { storeId }) =>
      await prisma.product.findMany({ where: { storeId } }),
    product: async (_, { id }) =>
      await prisma.product.findUnique({ where: { id } }),
  },
  Mutation: {
    createProduct: async (
      _,
      {
        storeId,
        name,
        price,
        discountPrice,
        quantity,
        description,
        saleEndTime,
      }
    ) => {
      return await prisma.product.create({
        data: {
          storeId,
          name,
          price,
          discountPrice,
          quantity,
          description,
          saleEndTime,
        },
      });
    },
    updateProduct: async (
      _,
      { id, name, price, discountPrice, quantity, description, saleEndTime }
    ) => {
      return await prisma.product.update({
        where: { id },
        data: {
          name,
          price,
          discountPrice,
          quantity,
          description,
          saleEndTime,
        },
      });
    },
    deleteProduct: async (_, { id }) => {
      return await prisma.product.delete({ where: { id } });
    },
  },
  Product: {
    store: async (parent) =>
      await prisma.store.findUnique({ where: { id: parent.storeId } }),
  },
};
