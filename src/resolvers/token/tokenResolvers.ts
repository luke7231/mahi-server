import { prisma } from "../../index.js";

export const tokenResolvers = {
  //   Query: {
  //     tokens: async () => {
  //       const tokens = await prisma.expo_Token.findMany();
  //       return tokens;
  //     },
  //   },
  Mutation: {
    createToken: async (_, { data }: { data: { token: string } }) => {
      const existingToken = await prisma.expo_Token.findUnique({
        where: {
          token: data.token,
        },
      });

      // If it already exists, return it (or handle according to your needs)
      if (existingToken) {
        return existingToken;
      }

      const newToken = await prisma.expo_Token.create({
        data,
      });
      return newToken;
    },
  },
};
