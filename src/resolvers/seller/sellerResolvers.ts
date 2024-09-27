import { prisma } from "../../index.js";
import { generateSellerToken } from "../../lib/jwt-token.js";

export const sellerResolvers = {
  Query: {
    seller: async (_, __, { seller }) => {
      const dbSeller = await prisma.seller.findUnique({
        where: { id: seller.id },
        include: { store: true }, // stores 필드를 포함해서 조회
      });
      return dbSeller;
    },
    sellers: async () => {
      const sellers = await prisma.seller.findMany({
        include: { store: true }, // 모든 sellers 조회
      });
      return sellers;
    },
  },
  Mutation: {
    // TODO: *사장님께서 직접 회원가입을 하는 날이 오면 push_token args로 받아야함.*
    createSeller: async (
      _,
      { name, email, password, contactNumber, address }
    ) => {
      // 중복 이메일 체크
      const existingSeller = await prisma.seller.findUnique({
        where: { contactNumber },
      });

      if (existingSeller) {
        throw new Error("이미 존재하는 이메일입니다.");
      }

      // Seller 생성
      const newSeller = await prisma.seller.create({
        data: {
          name,
          email,
          password,
          contactNumber,
          address,
        },
      });

      // 토큰 발행
      const token = generateSellerToken(newSeller);

      return {
        seller: newSeller,
        token, // 클라이언트에 토큰 반환
      };
    },
    updateSeller: async (
      _,
      { name, email, contactNumber, address },
      { seller }
    ) => {
      const updatedSeller = await prisma.seller.update({
        where: { id: seller.id },
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
    sellerLogin: async (_, { contactNumber, password, push_token }) => {
      // 1. 번호로 셀러 찾기
      const seller = await prisma.seller.findUnique({
        where: { contactNumber },
      });

      if (!seller) {
        return { error: "Seller not found" };
      }

      if (push_token && !seller.push_token) {
        await prisma.seller.update({
          where: {
            contactNumber,
          },
          data: {
            push_token,
          },
        });
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
