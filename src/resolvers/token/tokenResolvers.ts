import { prisma } from "../../index.js";

export const tokenResolvers = {
  //   Query: {
  //     tokens: async () => {
  //       const tokens = await prisma.expo_Token.findMany();
  //       return tokens;
  //     },
  //   },
  Mutation: {
    createToken: async (_, { data }) => {
      console.log(data);
      const newToken = await prisma.expo_Token.create({
        data,
      });
      return newToken;
    },
  },
};
