import { prisma } from "../../index.js";
import { sendPushNotification } from "../../lib/expo-token.js";
import { uploadToS3 } from "../../lib/file/index.js";

export const productResolvers = {
  Query: {
    products: async (_, { storeId }) =>
      await prisma.product.findMany({ where: { storeId } }),
    product: async (_, { id }) =>
      await prisma.product.findUnique({ where: { id } }),
    productsBySeller: async (_, args, { seller }) => {
      const existSeller = await prisma.seller.findUnique({
        where: { id: seller.id },
      });
      const store = await prisma.store.findUnique({
        where: { id: existSeller.storeId },
      });
      const products = await prisma.product.findMany({
        where: {
          storeId: store.id,
          OR: [{ isDeleted: false }, { isDeleted: null }],
        },
        include: {
          order: {
            include: {
              user: true, // order에 연결된 user 정보를 포함
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return products;
    },
    todaysProducts: async (_, { storeId }) => {
      // Store 정보를 가져옴
      const store = await prisma.store.findUnique({
        where: { id: storeId },
      });

      // store가 없으면 에러 반환
      if (!store) {
        throw new Error("Store not found");
      }

      // 현재 날짜를 가져옴
      const today = new Date();

      // store의 closingHour 값을 사용하여 오늘의 마감 시간 (todayEnd)을 설정
      const [closingHour, closingMinute] = store.closingHours.split(":"); // '21:00' -> ['21', '00']

      const todayEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        parseInt(closingHour, 10), // closingHour의 시 값을 설정
        parseInt(closingMinute, 10), // closingHour의 분 값을 설정
        59 // 초는 59로 고정
      );
      console.log(todayEnd);

      // 오늘 시작 시간 설정
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0
      );

      // 해당 storeId의 오늘 생성된 products 찾기
      const products = await prisma.product.findMany({
        where: {
          storeId: store.id,
          createdAt: {
            gte: todayStart, // 오늘 00:00:00 이후 생성된 제품
            lte: todayEnd, // 오늘의 closingHour 이전에 생성된 제품
          },
          OR: [{ isDeleted: false }, { isDeleted: null }],
        },
      });

      return products;
    },
  },
  Mutation: {
    // 푸시알람 가즈아
    createProduct: async (_, { input }, { seller }) => {
      const existSeller = await prisma.seller.findUnique({
        where: {
          id: seller.id,
        },
      });
      const {
        menus,
        name,
        price,
        discountPrice,
        description,
        quantity,
        saleEndTime,
        img,
      } = input;

      let imageUrl = null;

      // 이미지 파일이 존재하면 S3에 업로드
      if (img) {
        imageUrl = await uploadToS3(img, "product-banner");
      }

      const userPrice =
        Math.floor((discountPrice + discountPrice * 0.1) / 10) * 10;

      const newProduct = await prisma.product.create({
        data: {
          store: { connect: { id: existSeller.storeId } }, // store 연결
          name,
          price,
          discountPrice,
          userPrice,
          description,
          saleEndTime,
          menus: menus
            ? {
                create: menus.map((menu) => ({
                  menu: { connect: { id: menu.menuId } }, // 각 메뉴와 연결
                  quantity: menu.quantity, // 각 메뉴의 수량 저장
                  img: menu.img || null, // img 필드 처리
                })),
              }
            : {},
          img: imageUrl,
          quantity,
        },
        include: {
          menus: true, // 연결된 메뉴와의 관계도 가져오도록 include
        },
      });

      if (newProduct) {
        const store = await prisma.store.findUnique({
          where: { id: existSeller.storeId },
        });
        const likedUsers = await prisma.like.findMany({
          where: { storeId: existSeller.storeId },
          include: { user: true },
        });

        // 좋아요한 유저들의 이름만 담은 배열
        const likedUserTokens = likedUsers.map((like) => like.user.push_token);

        const message = `${store.title}🍳에서 새로운 팩이 나왔어요!🎉`;
        const data = { storeId: store.id };

        const 동주민 = await prisma.expo_Token.findMany({
          where: {
            area1: store.area1,
            area2: store.area2,
            area3: store.area3,
            area4: store.area4,
          },
        });

        const tokens = 동주민.map((주민) => 주민.token);
        const message2 = `${store.area3}에 새로운 재고가 올라왔어요!🎉`;
        const data2 = { storeId: store.id };

        const products = await prisma.product.findMany({
          where: {
            storeId: store.id,
          },
          orderBy: { createdAt: "desc" },
        });
        const recentProduct = products[1];

        // 현재 시간과 recentProduct의 생성 시간을 비교
        if (recentProduct) {
          const now = new Date();
          const productCreatedAt = new Date(recentProduct.createdAt);
          const timeDifferenceInMinutes =
            (now.getTime() - productCreatedAt.getTime()) / 1000 / 60;

          // 1분 이상 차이가 나야 푸시 알림을 발송
          if (likedUserTokens.length !== 0 && timeDifferenceInMinutes > 1) {
            sendPushNotification(likedUserTokens, message, data);
          }
          if (tokens.length !== 0 && timeDifferenceInMinutes > 1) {
            sendPushNotification(tokens, message2, data2);
          }
        }
      }

      return newProduct;
    },
    updateProduct: async (
      _,
      {
        input: {
          id,
          name,
          price,
          discountPrice,
          quantity,
          description,
          saleEndTime,
        },
      }
    ) => {
      return await prisma.product.update({
        where: { id },
        data: {
          name,
          price,
          discountPrice,
          quantity,
          description,
          saleEndTime,
        },
      });
    },
    deleteProduct: async (_, { id }) => {
      return await prisma.product.update({
        where: { id },
        data: { isDeleted: true },
      });
    },
  },
  Product: {
    store: async (parent) =>
      await prisma.store.findUnique({ where: { id: parent.storeId } }),
    menus: async (parent) => {
      return await prisma.productMenu.findMany({
        where: { productId: parent.id }, // 해당 product와 연결된 메뉴를 가져옴
        include: { menu: true }, // 연결된 Menu 객체 포함
      });
    },
    isToday: async (parent) => {
      const today = new Date();

      // 해당 product의 store 정보를 가져옴
      const store = await prisma.store.findUnique({
        where: {
          id: parent.storeId,
        },
        select: {
          closingHours: true,
        },
      });

      if (!store || !store.closingHours) {
        return false; // store가 없거나 closingHours 정보가 없으면 false 리턴
      }

      // closingHours를 시간으로 변환
      const [hours, minutes] = store.closingHours.split(":").map(Number);
      const storeClosingTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        hours,
        minutes,
        0
      );

      // 오늘 시작 시간 (00:00:00)
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0
      );

      // product가 오늘 만들어졌고, store의 closingHours를 지나지 않았는지 확인
      return parent.createdAt >= todayStart && today <= storeClosingTime;
    },
  },
};
