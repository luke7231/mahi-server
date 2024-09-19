import { prisma } from "../../index.js";

export const menuResolvers = {
  Query: {
    menu: async (_, { id }) => {
      return await prisma.menu.findUnique({
        where: { id },
        include: { store: true },
      });
    },
    menus: async (_, { storeId }) => {
      return await prisma.menu.findMany({
        where: { storeId },
      });
    },
  },
  Mutation: {
    createMenu: async (_, { storeId, name, price, img }) => {
      return await prisma.menu.create({
        data: {
          name,
          price,
          img,
          store: { connect: { id: storeId } },
        },
      });
    },
    updateMenu: async (_, { id, name, price, img }) => {
      return await prisma.menu.update({
        where: { id },
        data: {
          name,
          price,
          img,
        },
      });
    },
    deleteMenu: async (_, { id }) => {
      return await prisma.menu.delete({
        where: { id },
      });
    },
  },
};
