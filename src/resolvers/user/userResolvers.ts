import axios from "axios";
import { prisma } from "../../index.js";
import { generateToken } from "../../lib/jwt-token.js";

export const userResolvers = {
  Query: {
    kakaoLogin: async (_, { code, client_id, redirect_url }) => {
      try {
        const postUrl = "https://kauth.kakao.com/oauth/token";
        const grant_type = "authorization_code";
        const getToken = async () => {
          const res = await axios.post(
            postUrl,
            {
              grant_type, // 고정
              client_id, // REST API KEY
              code, // 인가 코드
              redirect_url,
            },
            {
              headers: {
                "Content-type":
                  "application/x-www-form-urlencoded;charset=utf-8",
              },
            }
          );
          return res.data.access_token;
        };
        const accessToken = await getToken();

        // 카카오 토큰으로 유저 정보를 조회하는 함수.
        const requestUserInfo = async (accessToken: string) => {
          try {
            const url = "https://kapi.kakao.com/v2/user/me";

            const res = await axios.post(
              url,
              {},
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-type":
                    "application/x-www-form-urlencoded;charset=utf-8",
                },
              }
            );

            return res.data;
          } catch (error) {
            console.log(error);
          }
        };

        // 토큰을 받았으면 서비스(마히) 내에서 유저 가입or로그인 처리를 한다.
        if (accessToken) {
          // kakao v2 -> user/me
          const userInfo = await requestUserInfo(accessToken);
          // console.log("userInfo: ", userInfo);
          if (userInfo.id) {
            const kakaoEmail = userInfo.kakao_account.email;
            // 키카오 이메일로 서비스 db 조회
            let user = await prisma.user.findUnique({
              where: {
                email: kakaoEmail,
              },
            });
            console.log("existUser:", user);

            if (!user) {
              // 없으면 [회원가입].
              user = await prisma.user.create({
                data: {
                  email: kakaoEmail,
                },
              });
              console.log("newUser: ", user);
            }

            // JWT 토큰 생성
            const token = generateToken(user);
            console.log("id:", user.id, "token:", token);

            return { user, token }; // 유저 정보와 토큰 반환
          }
        }
        return null;
      } catch (e) {
        console.log(e);
      }
    },
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
