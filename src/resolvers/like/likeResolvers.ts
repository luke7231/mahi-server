import { prisma } from "../../index.js";

export const likeResolvers = {
  Mutation: {
    likeStore: async (_, { userId, storeId }) => {
      // Check if the like already exists
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_storeId: {
            userId,
            storeId,
          },
        },
        include: {
          user: true,
          store: true,
        },
      });

      // If it already exists, return it (or handle according to your needs)
      if (existingLike) {
        return existingLike;
      }

      // Create a new like entry
      const newLike = await prisma.like.create({
        data: {
          user: { connect: { id: userId } },
          store: { connect: { id: storeId } },
        },
        include: {
          user: true,
          store: true,
        },
      });
      return newLike;
    },
  },
};
