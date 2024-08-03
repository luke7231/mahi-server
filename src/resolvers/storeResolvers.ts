import { prisma } from "../index.js";

export const storeResolvers = {
  Query: {
    storeList: async (_, { id }) => {
      console.log(id, "hello");
      const stores = await prisma.store.findMany();
      console.log(stores);
      return stores; // Assuming DATA is a placeholder, returning actual stores from the database.
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
        console.log(newStore);

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
};
