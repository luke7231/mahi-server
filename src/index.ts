import dotenv from "dotenv";

dotenv.config();
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import { typeDefs } from "./graphql/index.js";
import { resolvers } from "./resolvers/index.js";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import { AuthResponse } from "./types.js";
import axios from "axios";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import { sendPushNotification } from "./lib/expo-token.js";

interface MyContext {
  token?: string;
}

const SECRET_KEY = process.env.JWT_SECRET_KEY;
export const prisma = new PrismaClient();
// Required logic for integrating with Express
const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

// Same ApolloServer initialization as before, plus the drain plugin
// for our httpServer.
const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  introspection: true,
});
// Ensure we wait for our server to start
await server.start().then(async (res) => {
  // const order = await prisma.order.findUnique()
  app.use(bodyParser.json()); // JSON 형식의 본문 파싱
  app.use(bodyParser.urlencoded({ extended: true })); // URL-encoded 형식의 본문 파싱
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

  // /nice-auth 엔드포인트 설정
  app.post("/nice-auth", async (req, res) => {
    // throw new Error("그냥 에러요~");
    const paymentResult = req.body as AuthResponse;
    const paymentResultAmount = paymentResult.amount;
    console.log("auth 결과:", paymentResult); // 결제 결과 로그 출력
    const cartItems = JSON.parse(paymentResult.mallReserved);
    const isSuccess = paymentResult.authResultCode === "0000";
    if (!isSuccess) {
      console.log("결제에 실패했습니다.");
    }
    let ok: string;
    let resCode: string;
    const tid = paymentResult.tid;
    const orderId = paymentResult.orderId;
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: { products: true },
    });

    if (!order) {
      console.log("에러: order");
    }
    const isSame = order.amount === Number(paymentResultAmount);
    if (!isSame) {
      console.log("에러: isSame");
    }

    // *********************************
    // 개수 남아있는지 마지막으로 파악
    // *********************************
    let canGo = true;
    // 마지막으로 수량 체크해야함. 누군가 db 변경했을 수도 있잖.
    for (const cartItem of cartItems) {
      const existproduct = await prisma.product.findUnique({
        where: { id: cartItem.product.id },
      });
      if (existproduct.isSoldout) {
        const message = `${existproduct.name} 상품이 품절되었습니다.`;
        res.redirect(
          `${
            process.env.NICE_AUTH_REDIRECT_URL
          }?ok=${0}&code=${400}&message=${message}`
        );
        canGo = false;
        return; // 중요: 여기서 return을 사용하여 함수를 종료
      }
      if (existproduct.quantity < cartItem.quantity) {
        const message = `구매하려는 상품의 개수가 부족합니다. (남은 재고 ${existproduct.quantity}개)`;
        res.redirect(
          `${
            process.env.NICE_AUTH_REDIRECT_URL
          }?ok=${0}&code=${400}&message=${message}`
        );
        canGo = false;
        return;
      }
    }

    if (!canGo) return;
    // *********************************
    // ****** 승인 API 호출 시작 ******
    // *********************************

    const clientKey = process.env.NICE_PAY_CLIENT_KEY;
    const secretKey = process.env.NICE_PAY_SECRET_KEY;

    // Step 2: Combine clientKey and secretKey with a colon separator
    const credentials = `${clientKey}:${secretKey}`;

    // Step 3: Base64 encode the combined string
    const encodedCredentials = Buffer.from(credentials).toString("base64");

    // Prepare the URL and headers
    const url = `https://api.nicepay.co.kr/v1/payments/${tid}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    };

    // Prepare the request data
    const data = {
      amount: Number(paymentResultAmount),
    };

    // Make the POST request using Axios
    axios
      .post(url, data, { headers })
      .then(async (response) => {
        // *********************************
        // ****** 승인 API 호출 시작 ******
        // *********************************
        if (response.data.resultCode === "0000") {
          await prisma.order.update({
            where: { orderId },
            data: { isApproved: true, tid },
          });

          // 재고 업데이트
          await cartItems.map(async (cartItem) => {
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
                order: { connect: { id: order.id } },
              },
            });
          });

          const amount = response.data.amount;
          res.redirect(
            `${
              process.env.NICE_AUTH_REDIRECT_URL
            }?ok=${1}&code=${200}&amount=${amount}&orderId=${order.id}`
          );
          return;
        } else {
          ok = "0";
          resCode = "500";
        }
      })
      .catch((error) => {
        ok = "0";
        resCode = "500";
        console.log(error);
        res.redirect(
          `${process.env.NICE_AUTH_REDIRECT_URL}?ok=${ok}&code=${resCode}`
        );
        return;
      });
    // 결제 결과를 쿼리 문자열로 포함하여 리디렉션
  });
});

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
  "/",
  cors<cors.CorsRequest>({
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    origin: "*",
  }),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      const userToken = req.headers["authorization"] || ""; // 유저 토큰
      const sellerToken = (req.headers["seller-authorization"] as string) || ""; // 셀러 토큰

      let user = null;
      let seller = null;

      // 유저 토큰 검증
      if (userToken) {
        try {
          const decodedUser = jwt.verify(
            userToken.replace("Bearer ", ""),
            SECRET_KEY
          );

          user = await prisma.user.findUnique({
            where: { id: decodedUser.id },
          });

          if (!user) {
            throw new Error("User not found");
          }
        } catch (err) {
          throw new Error("Invalid/Expired user token");
        }
      }

      // 셀러 토큰 검증
      if (sellerToken) {
        try {
          const decodedSeller = jwt.verify(
            sellerToken.replace("Bearer ", ""),
            SECRET_KEY
          );

          seller = await prisma.seller.findUnique({
            where: { id: decodedSeller.id },
          });

          if (!seller) {
            throw new Error("Seller not found");
          }
        } catch (err) {
          throw new Error("Invalid/Expired seller token");
        }
      }

      // user와 seller 모두 context에 저장
      return { user, seller };
    },
  })
);

// Modified server startup
await new Promise<void>((resolve) =>
  httpServer.listen({ port: 4000 }, resolve)
);
console.log(`🚀 Server ready at http://localhost:4000/`);
