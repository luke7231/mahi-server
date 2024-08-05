import { prisma } from "../index.js";

export const storeResolvers = {
  Query: {
    //고도화
    stores: async (_) => {
      const stores = await prisma.store.findMany();
      return stores;
    },
  },
  Mutation: {
    createStore: async (_, { lat, lng, title }) => {
      try {
        const newStore = await prisma.store.create({
          data: {
            lat,
            lng,
            title,
          },
        });

        return {
          ok: true,
          error: null,
        };
      } catch (error) {
        console.error(error);
        return {
          ok: false,
          error: "Failed to create store",
        };
      }
    },
  },
  Store: {
    likes: async (parent) => {
      const likes = await prisma.like.findMany({
        where: { storeId: parent.id },
      });
      return likes;
    },
  },
};
