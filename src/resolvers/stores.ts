import { DATA } from "../data/data.js";
import { prisma } from "../index.js";

export const stores = async (_, { id }) => {
  console.log(id, "hello");
  const stores = await prisma.store.findMany();
  console.log(stores);
  return DATA;
};
export const createStore = async (_, { lat, lng, title }) => {
  try {
    const newStore = await prisma.store.create({
      data: {
        lat,
        lng,
        title,
      },
    });
    console.log(newStore);

    return {
      ok: true,
      error: "",
    };
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      error: "Failed to create store",
    };
  }
};
