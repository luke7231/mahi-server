import { prisma } from "../../index.js";

// TODO: 시크릿키 변경
const widgetSecretKey = "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";
const encryptedSecretKey =
  "Basic " + Buffer.from(widgetSecretKey + ":").toString("base64");

export const orderResolvers = {
  Query: {
    orders: async (_, __, { user }) => {
      const orders = await prisma.order.findMany({
        where: {
          userId: user.id,
        },
        include: { products: true },
        orderBy: { createdAt: "desc" },
      });
      console.log(orders);
      return orders;
    },
    order: async (_, { id }) => {
      return await prisma.order.findUnique({
        where: { id: Number(id) },
        include: { products: true },
      });
    },
    compareOrderAmount: async (_, { orderId, amount, paymentKey }) => {
      const order = await prisma.order.findUnique({
        where: { orderId },
      });

      if (!order) {
        throw new Error("Order not found");
      }
      const isSame = order.amount === amount;
      if (!isSame) {
        return false;
      }

      async function confirmPayment() {
        try {
          const response = await fetch(
            "https://api.tosspayments.com/v1/payments/confirm",
            {
              method: "POST",
              headers: {
                Authorization: encryptedSecretKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderId: orderId,
                amount: amount,
                paymentKey: paymentKey,
              }),
            }
          );

          if (response.ok) {
            // 결제 성공 비즈니스 로직을 구현하세요.
            console.log("승인완료 🤩");
            return {
              ok: true,
              error: null,
            };
          } else {
            // 결제 실패 비즈니스 로직을 구현하세요.
            console.log("승인실패 ❌");
            const result = (await response.json()) as {
              code: string;
              message: string;
            };
            return {
              ok: false,
              error: result.message,
            };
          }
        } catch (error) {
          // 네트워크 에러 등 기타 오류 처리
          console.error("Error:", error);
          return {
            ok: false,
            error,
          };
        }
      }
      // return order.amount === amount;
      return await confirmPayment();
    },
  },
  Mutation: {
    createOrder: async (
      _,
      { input: { orderId, amount, coupon, productIds } },
      { user }
    ) => {
      const createdOrder = await prisma.order.create({
        data: {
          user: { connect: { id: user.id } },
          orderId,
          amount,
          coupon,
          products: {
            connect: productIds.map((id) => ({ id })),
          },
        },
        include: { products: true },
      });
      return createdOrder;
    },
    // 아직 안쓸 것 같긴해요. (gpt가 써준 거.)
    updateOrder: async (_, { input }) => {
      const { id, orderId, amount, coupon } = input;
      return await prisma.order.update({
        where: { id },
        data: {
          orderId,
          amount,
          coupon,
        },
      });
    },
    // 음 에러처리는 클라이언트에서 발생시 처리한다.
    deleteOrder: async (_, { orderId }) => {
      return await prisma.order.delete({ where: { orderId } });
    },
  },
  Order: {
    products: async (parent) => {
      return await prisma.product.findMany({
        where: { id: { in: parent.productIds } },
      });
    },
  },
};
