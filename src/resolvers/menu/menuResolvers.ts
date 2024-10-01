import { prisma } from "../../index.js";
import { uploadToS3 } from "../../lib/file/index.js";

export const menuResolvers = {
  Query: {
    menu: async (_, { id }) => {
      return await prisma.menu.findUnique({
        where: { id },
        include: { store: true },
      });
    },
    menus: async (_, args, { seller }) => {
      const existSeller = await prisma.seller.findUnique({
        where: {
          id: seller.id,
        },
      });
      return await prisma.menu.findMany({
        where: { storeId: existSeller.storeId },
      });
    },
  },
  Mutation: {
    createMenu: async (_, { storeId, name, price, img }, { seller }) => {
      const existSeller = await prisma.seller.findUnique({
        where: {
          id: seller.id,
        },
      });
      const existStore = await prisma.store.findUnique({
        where: {
          id: existSeller.storeId,
        },
      });

      let imageUrl = null;

      // 이미지 파일이 존재하면 S3에 업로드
      if (img) {
        imageUrl = await uploadToS3(img, "menu-banner");
      }

      return await prisma.menu.create({
        data: {
          name,
          price,
          img: imageUrl, // S3 URL 저장
          store: { connect: { id: existStore.id } },
        },
      });
    },
    updateMenu: async (_, { id, name, price, img }, { seller }) => {
      // 기존 메뉴 정보를 가져옴
      const existingMenu = await prisma.menu.findUnique({
        where: { id },
      });

      // 기존 이미지를 사용하고, 새로운 이미지가 있다면 S3에 업로드
      let imageUrl = existingMenu.img; // 기존 이미지가 기본값으로 설정됨

      if (img) {
        imageUrl = await uploadToS3(img, "menu-banner"); // 새로운 이미지 업로드
      }

      // 메뉴 업데이트
      return await prisma.menu.update({
        where: { id },
        data: {
          name,
          price,
          img: imageUrl, // 새로운 이미지가 있거나, 기존 이미지를 그대로 사용
        },
      });
    },
    deleteMenu: async (_, { id }) => {
      return await prisma.menu.delete({
        where: { id },
      });
    },
  },
  Menu: {
    // 메뉴의 store 정보를 가져오는 리졸버
    store: async (parent) => {
      return await prisma.store.findUnique({
        where: { id: parent.storeId }, // 메뉴와 연결된 storeId 사용
      });
    },

    // 만약 메뉴가 Product와 연관되어 있다면
    products: async (parent) => {
      return await prisma.product.findMany({
        where: { menus: { some: { menuId: parent.id } } }, // 메뉴와 연결된 product를 가져옴
      });
    },
  },
};
