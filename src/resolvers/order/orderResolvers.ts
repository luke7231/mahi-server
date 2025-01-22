import axios from "axios";
import { prisma } from "../../index.js";
import { sendPushNotification } from "../../lib/expo-token.js";
import { sendPaymentCompletionAlimTalkToSeller } from "../../lib/sms.js";

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
          isApproved: true,
        },
        include: { products: true },
        orderBy: { createdAt: "desc" },
      });

      return orders;
    },
    order: async (_, { id }) => {
      return await prisma.order.findUnique({
        where: { id: Number(id) },
        include: { products: true },
      });
    },
    compareOrderAmount: async (
      _,
      { orderId, amount, paymentKey, cartItems }
    ) => {
      const order = await prisma.order.findUnique({
        where: { orderId },
        include: { products: true },
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
          let canGo = true;
          let ranoutProduct;
          // 마지막으로 수량 체크해야함. 누군가 db 변경했을 수도 있잖.
          cartItems.forEach(async (cartItem) => {
            const existproduct = await prisma.product.findUnique({
              // 다시 조회
              where: { id: cartItem.product.id },
            });
            console.log("개수: ", existproduct.quantity);
            console.log("사려고하는 거 개수:", cartItem.quantity);
            if (existproduct.quantity < cartItem.quantity) {
              // db에 남은 개수 < 사려고하는 수량.
              throw new Error(
                `죄송합니다. [${ranoutProduct.name}] 제품의 재고가 부족합니다.`
              );
            }
          });

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
            await prisma.order.update({
              where: { orderId },
              data: { isApproved: true },
            });

            cartItems.map(async (cartItem) => {
              const existproduct = await prisma.product.findUnique({
                where: { id: cartItem.product.id },
              });
              const left = existproduct.quantity - cartItem.quantity;
              const isSoldout = left <= 0;

              await prisma.product.update({
                where: { id: existproduct.id },
                data: {
                  quantity: left,
                  isSoldout,
                },
              });
            });
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
    sendOrderCompletionNotification: async (_, { orderId }) => {
      try {
        // 주문 조회
        const order = await prisma.order.findUnique({
          where: { id: Number(orderId) },
          include: {
            products: true, // 주문에 연결된 상품
            user: true,
          },
        });

        if (!order) {
          throw new Error("Order not found");
        }

        // 첫 번째 상품의 storeId를 사용하여 스토어 조회
        const storeId = order.products[0].storeId;
        const store = await prisma.store.findUnique({
          where: { id: storeId },
          include: {
            Seller: true, // 스토어의 판매자 정보
          },
        });

        if (!store || !store.Seller || store.Seller.length === 0) {
          throw new Error("Seller information not found for the store");
        }

        // 판매자의 푸시 토큰 조회
        const sellerPushToken = store.Seller[0].push_token;
        if (!sellerPushToken) {
          return {
            ok: false,
            error: "Seller does not have a push token registered.",
          };
        }

        // 푸시 알림 메시지 전송
        const pushMessage = "결제가 발생했습니다💰!!";
        await sendPushNotification([sellerPushToken], pushMessage, {});

        const sellerPhoneNumber = store.Seller[0].contactNumber;
        await sendPaymentCompletionAlimTalkToSeller({
          sellerPhoneNumber,
          productName: order.products[0].name,
          customerName: order.user.name,
          customerContact: order.user?.phone,
          pickUpTime: order.pickUpTime,
        });

        return {
          ok: true,
          error: null,
        };
      } catch (error) {
        console.error("Error sending order completion notification:", error);
        return {
          ok: false,
          error:
            error.message || "An error occurred while sending the notification",
        };
      }
    },
  },
  Mutation: {
    createOrder: async (
      _,
      {
        input: {
          orderId,
          amount,
          coupon,
          productIds,
          totalQuantity,
          totalDiscount,
          pickUpTime,
        },
      },
      { user }
    ) => {
      const createdOrder = await prisma.order.create({
        data: {
          user: { connect: { id: user.id } },
          orderId,
          amount,
          totalQuantity,
          totalDiscount,
          coupon,
          pickUpTime,
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
    cancelOrder: async (_, { id, reason }) => {
      try {
        // Check if the order exists and belongs to the user
        const order = await prisma.order.findUnique({
          where: { id },
        });
        console.log(order);
        if (!order) {
          throw new Error("Order not found");
        }

        if (order.isCanceled) {
          return {
            ok: false,
            error: "This order has already been canceled.",
          };
        }

        const clientKey = process.env.NICE_PAY_CLIENT_KEY;
        const secretKey = process.env.NICE_PAY_SECRET_KEY;

        // Step 2: Combine clientKey and secretKey with a colon separator
        const credentials = `${clientKey}:${secretKey}`;

        // Step 3: Base64 encode the combined string
        const encodedCredentials = Buffer.from(credentials).toString("base64");

        // Make the cancel request to NicePay API using axios
        const response = await axios.post(
          `https://api.nicepay.co.kr/v1/payments/${order.tid}/cancel`,
          {
            reason: reason,
            orderId: order.orderId,
          },
          {
            headers: {
              Authorization: `Basic ${encodedCredentials}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(response);
        if (response.data.resultCode === "0000") {
          // Update the order status in the database
          await prisma.order.update({
            where: { id },
            data: {
              isCanceled: true,
            },
          });

          // push 알람 전송
          // 로직
          const customer = await prisma.user.findUnique({
            where: {
              id: order.userId,
            },
          });

          const pushMessage = "사장님이 주문을 취소하셨어요.";
          if (customer.push_token) {
            sendPushNotification([customer.push_token], pushMessage, {});
          }
          return {
            ok: true,
            error: null,
          };
        } else {
          // Handle the failure of the cancel request
          return {
            ok: false,
            error: response.data.resultMsg,
          };
        }
      } catch (error) {
        console.error("Error canceling order:", error);
        return {
          ok: false,
          error: error.message || "An error occurred while canceling the order",
        };
      }
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
