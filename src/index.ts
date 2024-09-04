import dotenv from "dotenv";

dotenv.config();
// npm install @apollo/server express graphql cors
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
await server.start().then((res) => {
  // app.use(bodyParser.json()); // JSON 형식의 본문 파싱
  // app.use(bodyParser.urlencoded({ extended: true })); // URL-encoded 형식의 본문 파싱
  // /nice-auth 엔드포인트 설정
  // app.post("/nice-auth", (req, res) => {
  //   const paymentResult = req.body;
  //   console.log("결제 결과:", paymentResult); // 결제 결과 로그 출력
  //   // const isSuccess = paymentResult.PCD_PAY_CODE === "0000";
  //   const message = paymentResult.authResultMsg;
  //   // const transactionId = paymentResult.transactionId || "unknown";
  //   // 결제 결과를 쿼리 문자열로 포함하여 리디렉션
  //   res.redirect(`${process.env.NICE_AUTH_REDIRECT_URL}?status=${message}`);
  // });
  // app.post("/payple-auth", (req, res) => {
  //   const paymentResult = req.body;
  //   console.log("결제 결과:", paymentResult); // 결제 결과 로그 출력
  //   // 클라이언트 측의 특정 URL로 리디렉션
  //   // const isSuccess = paymentResult.PCD_PAY_CODE === "0000";
  //   const message = paymentResult.PCD_PAY_MSG;
  //   // const transactionId = paymentResult.transactionId || "unknown";
  //   // 결제 결과를 쿼리 문자열로 포함하여 리디렉션
  //   res.redirect(`${process.env.NICE_AUTH_REDIRECT_URL}/nice-result?status=${message}`);
  // });
});

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
  "/",
  cors<cors.CorsRequest>({ origin: "*" }),
  express.json(),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
  expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.headers.authorization || "";

      if (token) {
        try {
          const decoded = jwt.verify(token.replace("Bearer ", ""), SECRET_KEY);
          return { user: decoded }; // 유저 정보를 context에 추가
        } catch (err) {
          throw new Error("Invalid/Expired token");
        }
      }

      return {};
    },
  })
);

// Modified server startup
await new Promise<void>((resolve) =>
  httpServer.listen({ port: 4000 }, resolve)
);
console.log(`🚀 Server ready at http://localhost:4000/`);
