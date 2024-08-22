import { prisma } from "../../index.js";

export const likeResolvers = {
  Mutation: {
    likeStore: async (_, { storeId }, { user }) => {
      // Check if the like already exists
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_storeId: {
            userId: user.id,
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
          user: { connect: { id: user.id } },
          store: { connect: { id: storeId } },
        },
        include: {
          user: true,
          store: true,
        },
      });
      return newLike;
    },
    cancelLike: async (_, { storeId }, { user }) => {
      const like = await prisma.like.findUnique({
        where: {
          userId_storeId: {
            userId: user.id,
            storeId,
          },
        },
      });

      if (!like) {
        throw new Error("Like not found");
      }

      const deletedLike = await prisma.like.delete({
        where: {
          userId_storeId: {
            userId: user.id,
            storeId,
          },
        },
        include: {
          user: true,
          store: true,
        },
      });
      return deletedLike;
    },
  },
};
