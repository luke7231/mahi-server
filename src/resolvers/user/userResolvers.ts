import axios from "axios";
import { prisma } from "../../index.js";
import { generateToken } from "../../lib/jwt-token.js";
import jwt from "jsonwebtoken";
import * as qs from "querystring";
import dotenv from "dotenv";
dotenv.config();

const KAKAO_UNLINK_URL = "https://kapi.kakao.com/v1/user/unlink";

interface Context {
  user: {
    id: number;
    email: string;
  };
}
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
                  kakaoId: userInfo.id,
                },
              });
              console.log("newUser: ", user);
            } else {
              if (user.isDeleted) {
                // 삭제했다가 다시 돌아온 경우.
                await prisma.user.update({
                  where: {
                    email: kakaoEmail,
                  },
                  data: {
                    isDeleted: false,
                    email: kakaoEmail,
                    kakaoId: userInfo.id,
                  },
                });
              }
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
    appleLogin: async (_, { id_token }) => {
      try {
        // const res = await getAppleToken(code);
        // console.log(res);
        const { sub: id, email } = (jwt.decode(id_token) ?? {}) as {
          sub: string;
          email: string;
          name?: string;
        };
        if (id) {
          return {
            token: "",
            user: {
              id,
              email,
            },
          };
        }
      } catch (e) {
        throw new Error(e);
      }
      return null;
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
    kakaoDeleteUser: async (_, __, { user }: Context) => {
      if (!user) {
        throw new Error("Authentication required");
      }
      console.log(user);

      // 유저 정보 가져오기
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!existingUser.id) {
        throw new Error("User not found");
      }

      // const formUrlEncoded = (x) =>
      //   Object.keys(x).reduce(
      //     (p, c) => p + `&${c}=${encodeURIComponent(x[c])}`,
      //     ""
      //   );
      // 카카오와 연결 끊기 요청
      try {
        await axios.post(
          KAKAO_UNLINK_URL,
          {
            target_id_type: "user_id", // 카카오에서 지정된 ID 유형
            target_id: existingUser.kakaoId, // 카카오 사용자 ID
          },
          {
            headers: {
              "Content-type": "application/x-www-form-urlencoded",
              Authorization: `KakaoAK ${process.env.KAKAO_ADMIN_KEY}`, // kakao 어드민 키 사용
            },
          }
        );
      } catch (error) {
        console.error("Failed to unlink Kakao account:", error);
        throw new Error("Failed to unlink Kakao account");
      }

      // 유저 삭제 처리
      try {
        await prisma.user.delete({
          where: { id: user.id },
        });
      } catch (e) {
        console.error("Error:", e.response?.data || e.message);
      }

      return { ok: true, error: null };
    },
    appleDeleteUser: async (_, { code }, { user }: Context) => {
      const createSignWithAppleSecret = () => {
        const signWithApplePrivateKey = process.env.APPLE_SECRET_KEY.replace(
          /\\n/g,
          "\n"
        ); // 줄 바꿈 처리

        // 현재 시간을 기준으로 생성
        const now = Math.floor(Date.now() / 1000);

        const payload = {
          iss: process.env.APPLE_TEAM_ID, // Apple Team ID
          iat: now, // Issued at (현재 시간)
          exp: now + 3600, // Expiration (1시간 후)
          aud: "https://appleid.apple.com", // Audience
          sub: "com.luke7299.mahi-sign-in", // Service ID or App ID
        };

        const options = {
          algorithm: "ES256",
          header: {
            kid: process.env.APPLE_KEY_ID, // Key ID
          },
        };

        const token = jwt.sign(payload, signWithApplePrivateKey, options);

        return token;
      };

      const getAppleToken = async (code: string) => {
        try {
          const response = await axios.post(
            "https://appleid.apple.com/auth/token",
            qs.stringify({
              grant_type: "authorization_code",
              code,
              client_secret: createSignWithAppleSecret(),
              client_id: "com.luke7299.mahi-sign-in",
              redirect_uri: process.env.APPLE_REDIRECT_URI,
            }),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );
          return response.data;
        } catch (e) {
          console.error("Error:", e.response?.data || e.message);
        }
      };

      const { access_token, refresh_token } = await getAppleToken(code);

      const revokeAccessToken = async (token: string) => {
        try {
          const response = await axios.post(
            "https://appleid.apple.com/auth/revoke",
            qs.stringify({
              client_id: "com.luke7299.mahi-sign-in", // Replace with your actual client ID
              client_secret: createSignWithAppleSecret(), // Function to generate your client secret
              token, // The token you want to revoke
              token_type_hint: "access_token", // Type of token being revoked
            }),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );
          return response;
        } catch (e) {
          console.error("Error:", e.response?.data || e.message);
        }
      };

      const revokeRefreshToken = async (refreshToken: string) => {
        try {
          const response = await axios.post(
            "https://appleid.apple.com/auth/revoke",
            qs.stringify({
              client_id: "com.luke7299.mahi-sign-in", // Replace with your actual client ID
              client_secret: createSignWithAppleSecret(), // Function to generate your client secret
              token: refreshToken, // The refresh token you want to revoke
              token_type_hint: "refresh_token", // Specify that the token is a refresh token
            }),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );
          return response;
        } catch (e) {
          console.error("Error:", e.response?.data || e.message);
        }
      };

      const { status: revokeAccessStatue } = await revokeAccessToken(
        access_token
      );
      const { status: revokeRefreshStatus } = await revokeRefreshToken(
        refresh_token
      );

      if (revokeAccessStatue == 200 && revokeRefreshStatus == 200) {
        try {
          await prisma.user.delete({
            where: {
              id: user.id,
            },
          });
        } catch (e) {
          console.error("Error:", e.response?.data || e.message);
        }

        return {
          ok: true,
          error: null,
        };
      } else {
        return {
          ok: false,
          error: "Failed to revoke token!",
        };
      }
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
