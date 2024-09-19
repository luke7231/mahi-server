import { prisma } from "../../index.js";
import { generateSellerToken } from "../../lib/jwt-token.js";

export const sellerResolvers = {
  Query: {
    seller: async (_, { id }) => {
      const seller = await prisma.seller.findUnique({
        where: { id },
        include: { store: true }, // stores 필드를 포함해서 조회
      });
      return seller;
    },
    sellers: async () => {
      const sellers = await prisma.seller.findMany({
        include: { store: true }, // 모든 sellers 조회
      });
      return sellers;
    },
  },
  Mutation: {
    createSeller: async (
      _,
      { name, email, password, contactNumber, address }
    ) => {
      const newSeller = await prisma.seller.create({
        data: {
          name,
          email,
          password,
          contactNumber,
          address,
        },
      });
      return newSeller;
    },
    updateSeller: async (_, { id, name, email, contactNumber, address }) => {
      const updatedSeller = await prisma.seller.update({
        where: { id },
        data: {
          name,
          email,
          contactNumber,
          address,
        },
      });
      return updatedSeller;
    },
    updateSellerPassword: async (
      _,
      { oldPassword, newPassword },
      { seller }
    ) => {
      if (!seller) {
        return { ok: false, error: "Authentication required" };
      }

      // 현재 유저가 Seller인지 확인
      const currentSeller = await prisma.seller.findUnique({
        where: { id: seller.id },
      });

      if (!currentSeller) {
        return { ok: false, error: "사장님 계정을 찾을 수 없습니다." };
      }

      // 기존 비밀번호 확인 (암호화 로직 제거)
      if (oldPassword !== currentSeller.password) {
        return { ok: false, error: "기존 비밀번호가 올바르지 않습니다." };
      }

      // 새 비밀번호 업데이트
      await prisma.seller.update({
        where: { id: seller.id },
        data: { password: newPassword }, // 암호화 없이 새 비밀번호 저장
      });

      return { ok: true, error: null };
    },
    deleteSeller: async (_, { id }) => {
      const deletedSeller = await prisma.seller.delete({
        where: { id },
      });
      return deletedSeller;
    },
    sellerLogin: async (_, { email, password }) => {
      // 1. 이메일로 셀러 찾기
      const seller = await prisma.seller.findUnique({
        where: { email },
      });

      if (!seller) {
        return { error: "Seller not found" };
      }

      // 2. 비밀번호 확인 (단순 비교, 필요시 bcrypt 사용 가능)
      if (seller.password !== password) {
        return { error: "Invalid password" };
      }

      // 3. 토큰 생성
      const token = generateSellerToken(seller);

      // 4. 토큰 반환
      return { token, error: null };
    },
  },
};
