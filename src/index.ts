import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./typeDefs/index.js";
import { resolvers } from "./resolvers/index.js";
import mongoose from "mongoose";

const MONGODB =
  "mongodb+srv://luke:luke@cluster0.383o933.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGODB)
  .then(() => {
    console.log(`Db Connected 🌳`);
  })
  .catch((err) => {
    console.log(err.message);
  });

// ------------------------------------------------------

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
