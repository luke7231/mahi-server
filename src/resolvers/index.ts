import { books } from "../data/data.js";
import { createStore, stores } from "./stores.js";

export const resolvers = {
  Query: {
    books: () => books,
    stores,
  },
  Mutation: {
    createStore,
  },
};
