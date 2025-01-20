import { prisma } from "../../index.js";

export const voteResolvers = {
  Query: {
    getAllVotes: async () => {
      return await prisma.vote.findMany({
        include: {
          user: true,
          uncontractedStore: true,
        },
      });
    },
    getUserVotes: async (_, { userId }) => {
      return await prisma.vote.findMany({
        where: {
          userId,
        },
        include: {
          user: true,
          uncontractedStore: true,
        },
      });
    },
  },
  Mutation: {
    voteForStores: async (_, { uncontractedStoreIds }, { user }) => {
      if (!user) {
        throw new Error("User must be authenticated");
      }

      const votes = []; // 아래 for 루프에서 이걸 채워줄거임

      for (const uncontractedStoreId of uncontractedStoreIds) {
        // Check if the vote already exists
        const existingVote = await prisma.vote.findUnique({
          where: {
            userId_uncontractedStoreId: {
              userId: user.id,
              uncontractedStoreId,
            },
          },
          include: {
            user: true,
            uncontractedStore: true,
          },
        });

        // If it already exists, add it to the result array
        if (existingVote) {
          votes.push(existingVote);
          continue;
        }

        // Create a new vote entry
        const newVote = await prisma.vote.create({
          data: {
            user: { connect: { id: user.id } },
            uncontractedStore: { connect: { id: uncontractedStoreId } },
          },
          include: {
            user: true,
            uncontractedStore: true,
          },
        });
        votes.push(newVote);
      }

      return votes;
    },
    cancelVote: async (_, { uncontractedStoreId }, { user }) => {
      const vote = await prisma.vote.findUnique({
        where: {
          userId_uncontractedStoreId: {
            userId: user.id,
            uncontractedStoreId,
          },
        },
      });

      if (!vote) {
        throw new Error("Vote not found");
      }

      const deletedVote = await prisma.vote.delete({
        where: {
          userId_uncontractedStoreId: {
            userId: user.id,
            uncontractedStoreId,
          },
        },
        include: {
          user: true,
          uncontractedStore: true,
        },
      });
      return deletedVote;
    },
  },
};
