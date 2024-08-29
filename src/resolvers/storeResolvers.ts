import { Store } from "@prisma/client";
import { prisma } from "../index.js";

export const storeResolvers = {
  Query: {
    store: async (_, { id }, { user }) => {
      try {
        const store = await prisma.store.findUnique({
          where: { id: id },
        });
        if (!store) {
          throw new Error("Store not found");
        }
        if (!user) return store;

        const likes = await prisma.like.findMany({
          where: { userId: user.id },
        });

        const likeIds = likes.map((like) => like.storeId);
        const set = new Set(likeIds);

        // 단일 객체에 대해 isLiked 속성을 추가
        const updatedStore = {
          ...store,
          isLiked: set.has(store.id),
        };
        return updatedStore;
      } catch (error) {
        throw new Error("Error fetching store");
      }
    },
    //고도화
    stores: async (
      _,
      { lat, lng }: { lat?: number; lng?: number },
      { user } // TODO: token에서 뽑기?
    ) => {
      const latitude = lat || 37.4552003863507; // 가천대
      const longitude = lng || 127.13370255097; // 가천대

      // [거리순 LOGIC]
      // TODO: 필터에 따라 다르게 가야함. (가격순, 거리순, 추천순 등등)
      // ToDO: 페이지 네이션 (무한 스크롤)
      const storesWithDistance = await prisma.$queryRaw`
      SELECT *
      FROM (
          SELECT
          store.*,
          (6371 * acos(
          cos(CAST(store.lat AS FLOAT) * 3.141592653589793 / 180.0) *
          cos(${latitude} * 3.141592653589793 / 180.0) *
          cos((${longitude} * 3.141592653589793 / 180.0) - (CAST(store.lng AS FLOAT) * 3.141592653589793 / 180.0)) +
          sin(CAST(store.lat AS FLOAT) * 3.141592653589793 / 180.0) *
          sin(${latitude} * 3.141592653589793 / 180.0)
          )) as distance
          FROM store
      ) as stores_with_distance
      WHERE distance <= 5
      ORDER BY distance ASC;
`;

      if (!user) return storesWithDistance;
      const likes = await prisma.like.findMany({
        where: { userId: user.id },
      });
      const likeIds = likes.map((like) => like.storeId);
      const set = new Set(likeIds);

      let newArray = (storesWithDistance as Array<Store>).map((item) => {
        // user.id가 bSet에 포함되어 있으면 user.isLiked를 true로 설정
        return {
          ...item,
          isLiked: set.has(item.id),
        };
      });
      return newArray;
    },
    likedStores: async (_, __, { user }) => {
      const likes = await prisma.like.findMany({
        where: { userId: user.id },
        include: { store: true },
      });
      return likes.map((like) => {
        return {
          ...like.store,
          isLiked: true,
        };
      });
    },
  },
  Mutation: {
    createStore: async (_, { lat, lng, title }) => {
      try {
        const newStore = await prisma.store.create({
          data: {
            lat,
            lng,
            title,
          },
        });

        return {
          ok: true,
          error: null,
        };
      } catch (error) {
        console.error(error);
        return {
          ok: false,
          error: "Failed to create store",
        };
      }
    },
  },
  Store: {
    likes: async (parent) => {
      const likes = await prisma.like.findMany({
        where: { storeId: parent.id },
      });
      return likes;
    },
    products: async (parent) =>
      await prisma.product.findMany({ where: { storeId: parent.id } }),
  },
};
