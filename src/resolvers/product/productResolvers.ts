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

        // (최종 발송)
        if (likedUserTokens.length !== 0) {
          sendPushNotification(likedUserTokens, message, data);
        }
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
        if (tokens.length !== 0) {
          sendPushNotification(tokens, message2, data2);
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
  },
};
