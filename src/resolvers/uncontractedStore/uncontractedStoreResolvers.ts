import { prisma } from "../../index.js";

export const uncontractedStoreResolvers = {
  Query: {
    getUncontractedStores: async (_, __, { user }) => {
      if (!user) {
        throw new Error("User must be authenticated");
      }

      const stores = await prisma.uncontractedStore.findMany({
        include: {
          votes: true,
        },
      });

      const userVotes = await prisma.vote.findMany({
        where: { userId: user.id },
      });

      const userVoteIds = new Set(
        userVotes.map((vote) => vote.uncontractedStoreId)
      );

      const updatedStores = stores.map((store) => ({
        ...store,
        voteCount: store.votes.length,
        isVoted: userVoteIds.has(store.id),
      }));

      return updatedStores.sort((a, b) => b.voteCount - a.voteCount);
    },
    getUncontractedStore: async (_, { id }) => {
      return await prisma.uncontractedStore.findUnique({
        where: { id },
        include: {
          votes: true,
        },
      });
    },
  },
};
