import { prisma } from "../../index.js";
import { sendPushNotification } from "../../lib/expo-token.js";

export const productResolvers = {
  Query: {
    products: async (_, { storeId }) =>
      await prisma.product.findMany({ where: { storeId } }),
    product: async (_, { id }) =>
      await prisma.product.findUnique({ where: { id } }),
  },
  Mutation: {
    // 푸시알람 가즈아
    createProduct: async (_, { input }) => {
      const newProduct = await prisma.product.create({
        data: input,
      });

      if (newProduct) {
        const store = await prisma.store.findUnique({
          where: { id: input.storeId },
        });
        const likedUsers = await prisma.like.findMany({
          where: { storeId: input.storeId },
          include: { user: true },
        });

        // 좋아요한 유저들의 이름만 담은 배열
        const likedUserTokens = likedUsers.map((like) => like.user.push_token);

        const message = `${store.title}🍳에서 새로운 팩이 나왔어요!🎉`;
        const data = { storeId: store.id };

        // (최종 발송)
        if (likedUserTokens.length !== 0) {
          sendPushNotification(likedUserTokens, message, data);
        }
      }

      return newProduct;
    },
    updateProduct: async (
      _,
      {
        input: {
          id,
          name,
          price,
          discountPrice,
          quantity,
          description,
          saleEndTime,
        },
      }
    ) => {
      return await prisma.product.update({
        where: { id },
        data: {
          name,
          price,
          discountPrice,
          quantity,
          description,
          saleEndTime,
        },
      });
    },
    deleteProduct: async (_, { id }) => {
      return await prisma.product.delete({ where: { id } });
    },
  },
  Product: {
    store: async (parent) =>
      await prisma.store.findUnique({ where: { id: parent.storeId } }),
  },
};
