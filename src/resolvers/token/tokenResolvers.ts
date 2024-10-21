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
    setTokenToUser: async (_, { push_token }, { user }) => {
      const existUser = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
      });

      if (!existUser.push_token) {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            push_token,
          },
        });

        return true;
      }
      return false;
    },
    setTokenToSeller: async (_, { push_token }, { seller }) => {
      const existSeller = await prisma.seller.findUnique({
        where: {
          id: seller.id,
        },
      });
      if (!existSeller) {
        return false;
      }

      await prisma.seller.update({
        where: {
          id: seller.id,
        },
        data: {
          push_token,
        },
      });

      return true;
    },
  },
};
