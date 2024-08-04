import { prisma } from "../../index.js";

export const userResolvers = {
  Query: {
    users: async () => {
      const users = await prisma.user.findMany();
      return users;
    },
    user: async (_, { id }) => {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return user;
    },
  },
  Mutation: {
    createUser: async (_, { data }) => {
      console.log(data);
      const newUser = await prisma.user.create({
        data,
      });
      return newUser;
    },
    updateUser: async (_, { id, data }) => {
      const updatedUser = await prisma.user.update({
        where: { id },
        data,
      });
      return updatedUser;
    },
  },
  User: {
    likes: async (parent) => {
      const likes = await prisma.like.findMany({
        where: { userId: parent.id },
      });
      return likes;
    },
  },
};
