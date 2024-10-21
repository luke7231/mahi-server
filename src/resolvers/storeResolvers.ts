import { Store } from "@prisma/client";
import { prisma } from "../index.js";
import {
  getAddressFromCoords,
  getCoordsFromAddress,
} from "../lib/location/index.js";
import { uploadToS3 } from "../lib/file/index.js";

export const storeResolvers = {
  Query: {
    store: async (_, { id }, { user }) => {
      try {
        const store = await prisma.store.findUnique({
          where: { id: id },
          include: {
            products: {
              include: {
                menus: true,
              },
            },
          },
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
    justStores: async (_, __, { user }) => {
      const stores = await prisma.store.findMany();
      if (!user) return stores;
      const likes = await prisma.like.findMany({
        where: { userId: user.id },
      });
      const likeIds = likes.map((like) => like.storeId);
      const set = new Set(likeIds);

      let newArray = (stores as Array<Store>).map((item) => {
        // user.id가 bSet에 포함되어 있으면 user.isLiked를 true로 설정
        return {
          ...item,
          isLiked: set.has(item.id),
        };
      });
      return newArray;
    },
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

      const storeWithProducts = await Promise.all(
        (storesWithDistance as any).map(async (store) => {
          const today = new Date();

          // closingHours를 시간으로 변환
          const [hours, minutes] = store.closingHours.split(":").map(Number);
          const todayEnd = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            hours,
            minutes,
            0
          );

          const todayStart = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            0,
            0,
            0
          );

          const products = await prisma.product.findMany({
            where: {
              storeId: store.id,
              createdAt: {
                gte: todayStart, // 오늘 00:00:00 이후 생성된 제품
                lte: todayEnd, // closingHours까지 생성된 제품
              },
              OR: [{ isDeleted: false }, { isDeleted: null }],
            },
          });
          if (store.title === "띠드베이") {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            console.log(timeZone);
            console.log("today", today);
            console.log("todayStart", todayStart);
            console.log("todayEnd", todayEnd);
            console.log("product createdAt", products[0]?.createdAt);
          }
          // 현재 시간이 closingHours 이후라면 빈 배열 반환
          if (today > todayEnd) {
            return {
              ...store,
              todaysProducts: [],
            }; // 시간이 지났으므로 빈 배열 반환
          } // 근데 이렇게하면,, 그 뒤에 올리는 사람들것도 무조건 안보이겠네.
          return {
            ...store,
            todaysProducts: products,
          };
        })
      );
      const sortedStores = storeWithProducts
        // todaysProducts가 있는 가게를 먼저 배치
        .sort((a, b) => {
          // todaysProducts가 있는 경우와 없는 경우 우선순위 설정
          const hasProductsA =
            a.todaysProducts && a.todaysProducts.length > 0 ? 0 : 1;
          const hasProductsB =
            b.todaysProducts && b.todaysProducts.length > 0 ? 0 : 1;

          // 우선순위 1: todaysProducts가 있는 가게 먼저
          if (hasProductsA !== hasProductsB) {
            return hasProductsA - hasProductsB;
          }

          // 우선순위 2: distance가 가까운 가게 먼저
          return a.distance - b.distance;
        });

      if (!user) return sortedStores;
      const likes = await prisma.like.findMany({
        where: { userId: user.id },
      });
      const likeIds = likes.map((like) => like.storeId);
      const set = new Set(likeIds);

      let newArray = (sortedStores as Array<Store>).map((item) => {
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
    getSellerStore: async (_, __, { seller }) => {
      try {
        // 셀러가 로그인되어 있는지 확인
        if (!seller) {
          throw new Error("Seller not authenticated");
        }

        // 셀러가 소유한 스토어 찾기
        const sellerWithStore = await prisma.seller.findUnique({
          where: { id: seller.id },
          include: { store: true }, // 셀러와 연관된 스토어 가져오기
        });
        // console.log(sellerWithStore);

        // 스토어가 없을 경우 null 반환
        if (!sellerWithStore?.store) {
          return null; // 에러 대신 null을 반환하여 클라이언트에서 처리
        }

        return sellerWithStore.store;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch store");
      }
    },
  },
  Mutation: {
    createStore: async (
      _,
      { title, lat, lng, address, contactNumber, closingHours, img },
      { seller }
    ) => {
      try {
        // 셀러가 로그인되어 있는지 확인
        if (!seller) {
          throw new Error("Seller not authenticated");
        }

        let imageUrl = "";
        if (img) {
          imageUrl = await uploadToS3(img, "store-banner"); // S3에 업로드하고 URL을 반환
        }

        // const
        const geoCode = await getCoordsFromAddress({ query: address });
        const guessLat = parseFloat(geoCode.addresses[0]?.y) || 0; // 위도
        const guessLng = parseFloat(geoCode.addresses[0]?.x) || 0; // 경도

        const res = await getAddressFromCoords({
          lngInput: guessLng,
          latInput: guessLat,
        });
        const { area1, area2, area3, area4 } = res.results[0].region;

        // 새로운 Store 생성 및 Seller와 연결
        const newStore = await prisma.store.create({
          data: {
            lat: lat || 0,
            lng: lng || 0,
            title,
            address,
            contactNumber,
            closingHours,
            img: imageUrl,
            Seller: {
              connect: { id: seller.id }, // Seller와 연결
            },
            area1: area1.name,
            area2: area2.name,
            area3: area3.name,
            area4: area4.name,
          },
        });

        return newStore;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to update store");
      }
    },
    updateStore: async (
      _,
      { id, title, lat, lng, address, contactNumber, closingHours, img },
      { seller }
    ) => {
      try {
        // 셀러가 로그인되어 있는지 확인
        if (!seller) {
          throw new Error("Seller not authenticated");
        }
        // 업데이트할 Store를 확인
        const existStore = await prisma.store.findUnique({
          where: { id },
        });

        if (!existStore) {
          throw new Error("Store not found");
        }

        let imageUrl = existStore.img; // 기존 이미지 URL을 기본값으로 설정
        console.log(img);
        if (img) {
          imageUrl = await uploadToS3(img, "store-banner"); // S3에 업로드하고 URL을 반환
        }

        const geoCode = await getCoordsFromAddress({ query: address });
        const guessLat = parseFloat(geoCode.addresses[0]?.y) || 0; // 위도
        const guessLng = parseFloat(geoCode.addresses[0]?.x) || 0; // 경도

        const res = await getAddressFromCoords({
          lngInput: guessLng,
          latInput: guessLat,
        });
        const { area1, area2, area3, area4 } = res.results[0].region;

        // 셀러가 소유한 스토어인지 확인
        const store = await prisma.store.findUnique({
          where: { id },
          include: { Seller: true },
        });

        if (!store || store.Seller.some((s) => s.id !== seller.id)) {
          throw new Error("You do not own this store");
        }

        // 스토어 정보 업데이트
        const updatedStore = await prisma.store.update({
          where: { id },
          data: {
            title,
            lat: lat || 0,
            lng: lng || 0,
            address,
            contactNumber,
            closingHours,
            img: imageUrl,
            area1: area1.name,
            area2: area2.name,
            area3: area3.name,
            area4: area4.name,
          },
        });

        return updatedStore;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to update store");
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
    todaysProducts: async (parent) => {
      const now = new Date();

      // closingHours를 시간으로 변환
      const [hours, minutes] = parent.closingHours.split(":").map(Number);
      const closingTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0
      );

      // 현재 시간이 closingHours 이후라면 빈 배열 반환
      if (now > closingTime) {
        return []; // 시간이 지났으므로 빈 배열 반환
      } // 근데 이렇게하면,, 그 뒤에 올리는 사람들것도 무조건 안보이겠네.

      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      );

      const products = await prisma.product.findMany({
        where: {
          storeId: parent.id,
          createdAt: {
            gte: todayStart, // 오늘 00:00:00 이후 생성된 제품
            lte: closingTime, // closingHours까지 생성된 제품
          },
          OR: [{ isDeleted: false }, { isDeleted: null }],
        },
      });

      return products;
    },
  },
};
