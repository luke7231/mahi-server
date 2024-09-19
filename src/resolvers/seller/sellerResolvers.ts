import { prisma } from "../../index.js";

export const sellerResolvers = {
  Query: {
    seller: async (_, { id }) => {
      const seller = await prisma.seller.findUnique({
        where: { id },
        include: { store: true }, // stores 필드를 포함해서 조회
      });
      return seller;
    },
    sellers: async () => {
      const sellers = await prisma.seller.findMany({
        include: { store: true }, // 모든 sellers 조회
      });
      return sellers;
    },
  },
  Mutation: {
    createSeller: async (
      _,
      { name, email, password, contactNumber, address }
    ) => {
      const newSeller = await prisma.seller.create({
        data: {
          name,
          email,
          password,
          contactNumber,
          address,
        },
      });
      return newSeller;
    },
    updateSeller: async (_, { id, name, email, contactNumber, address }) => {
      const updatedSeller = await prisma.seller.update({
        where: { id },
        data: {
          name,
          email,
          contactNumber,
          address,
        },
      });
      return updatedSeller;
    },
    deleteSeller: async (_, { id }) => {
      const deletedSeller = await prisma.seller.delete({
        where: { id },
      });
      return deletedSeller;
    },
  },
};
