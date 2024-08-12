import { prisma } from "../../index.js";

export const orderResolvers = {
  Query: {
    orders: async () => await prisma.order.findMany(),
    order: async (_, { id }) =>
      await prisma.order.findUnique({ where: { id } }),
    compareOrderAmount: async (_, { orderId, amount }) => {
      const order = await prisma.order.findUnique({
        where: { orderId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      return order.amount === amount;
    },
  },
  Mutation: {
    createOrder: async (_, { input }) => {
      const { orderId, amount, coupon, productId } = input;
      return await prisma.order.create({
        data: {
          orderId,
          amount,
          coupon,
          productId,
        },
      });
    },
    // 아직 안쓸 것 같긴해요. (gpt가 써준 거.)
    updateOrder: async (_, { input }) => {
      const { id, orderId, amount, coupon, productId } = input;
      return await prisma.order.update({
        where: { id },
        data: {
          orderId,
          amount,
          coupon,
          productId,
        },
      });
    },
    // 음 에러처리는 클라이언트에서 발생시 처리한다.
    deleteOrder: async (_, { orderId }) => {
      return await prisma.order.delete({ where: { orderId } });
    },
  },
  Order: {
    product: async (parent) =>
      await prisma.product.findUnique({ where: { id: parent.productId } }),
  },
};
