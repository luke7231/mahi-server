import { DATA } from "../data/data.js";
import Store from "../models/Store.js";

export const stores = async (_, { id }) => {
  console.log(id, "hello");
  const stores = await Store.find();
  console.log(stores);
  return DATA;
};
export const createStore = async (_, { lat, lng, title }) => {
  const create = new Store({
    lat,
    lng,
    title,
  });
  const res = await create.save();
  console.log(res);

  return {
    ok: true,
    error: "",
  };
};
