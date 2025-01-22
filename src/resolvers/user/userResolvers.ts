import axios from "axios";
import { prisma } from "../../index.js";
import { generateToken } from "../../lib/jwt-token.js";
import jwt from "jsonwebtoken";
import * as qs from "querystring";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { getCoordsFromAddress } from "../../lib/location/index.js";
import pkg from "solapi";
import { error } from "console";
const { SolapiMessageService } = pkg;

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
    getCoords: async (_, { address }) => {
      const geoCode = await getCoordsFromAddress({ query: address });
      const lat = parseFloat(geoCode.addresses[0]?.y) || 0; // 위도
      const lng = parseFloat(geoCode.addresses[0]?.x) || 0; // 경도

      return {
        lat,
        lng,
      };
    },
    getLocalAddress: async (_, { lat, lng, push_token }) => {
      const getAddressFromCoords = async ({
        lngInput,
        latInput,
      }: // expo push token
      {
        lngInput: number;
        latInput: number;
      }) => {
        // [docs]: https://api.ncloud-docs.com/docs/ai-naver-mapsreversegeocoding-gc#%EC%98%A4%EB%A5%98-%EC%BD%94%EB%93%9C
        const url =
          "https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc";
        const coords = `${lngInput},${latInput}`; // 좌표 객체를 문자열로 변환
        const params = {
          request: "coordsToaddr",
          coords: coords,
          sourcecrs: "epsg:4326",
          output: "json",
          orders: "roadaddr,legalcode",
        };
        try {
          const response = await axios.get(url, {
            headers: {
              "X-NCP-APIGW-API-KEY-ID": process.env.NAVER_CLIENT_ID,
              "X-NCP-APIGW-API-KEY": process.env.NAVER_CLIENT_SECRET,
            },
            params: params,
          });
          // throw new Error("just");
          return response.data;
        } catch (error) {
          throw new Error(error);
        }
      };

      // console.log(res.results[1]);
      // 1.  expo token findUnique
      // 2.  update -> area1,2,3,4

      const res = await getAddressFromCoords({ latInput: lat, lngInput: lng });

      const makeLoadAddr = (data) => {
        // const roadAddr = data.land.name; // 도로명
        // const roadNumber = data.land.number1;
        const region = [
          data.region.area1.name, // 시도
          data.region.area2.name, // 시군구
          data.region.area3.name, // 동읍면
          data.region.area4.name, // 상세주소
        ]
          .filter(Boolean)
          .join(" "); // 빈 값 제거 후 조합

        // 도로명 주소와 지역을 조합
        return `${region}`.trim();
      };
      const loadAddr = makeLoadAddr(res.results[0]);

      if (push_token) {
        const { area1, area2, area3, area4 } = res.results[0].region;

        const existingExpoToken = await prisma.expo_Token.findUnique({
          where: { token: push_token },
        });
        if (existingExpoToken) {
          await prisma.expo_Token.update({
            where: { token: push_token },
            data: {
              area1: area1.name,
              area2: area2.name,
              area3: area3.name,
              area4: area4.name,
            },
          });
        } else {
          await prisma.expo_Token.create({
            data: {
              token: push_token,
              area1: area1.name,
              area2: area2.name,
              area3: area3.name,
              area4: area4.name,
            },
          });
        }
      }

      const { area1, area2, area3, area4 } = res.results[0].region;
      return loadAddr;
    },
    getLocalAddressV2: async (_, { lat, lng, push_token, responseFormat }) => {
      const getAddressFromCoords = async ({
        lngInput,
        latInput,
      }: // expo push token
      {
        lngInput: number;
        latInput: number;
      }) => {
        // [docs]: https://api.ncloud-docs.com/docs/ai-naver-mapsreversegeocoding-gc#%EC%98%A4%EB%A5%98-%EC%BD%94%EB%93%9C
        const url =
          "https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc";
        const coords = `${lngInput},${latInput}`; // 좌표 객체를 문자열로 변환
        const params = {
          request: "coordsToaddr",
          coords: coords,
          sourcecrs: "epsg:4326",
          output: "json",
          orders: "roadaddr,legalcode",
        };
        try {
          const response = await axios.get(url, {
            headers: {
              "X-NCP-APIGW-API-KEY-ID": process.env.NAVER_CLIENT_ID,
              "X-NCP-APIGW-API-KEY": process.env.NAVER_CLIENT_SECRET,
            },
            params: params,
          });
          // throw new Error("just");
          return response.data;
        } catch (error) {
          throw new Error(error);
        }
      };

      // console.log(res.results[1]);
      // 1.  expo token findUnique
      // 2.  update -> area1,2,3,4

      const res = await getAddressFromCoords({ latInput: lat, lngInput: lng });

      const makeLoadAddr = (data) => {
        // const roadAddr = data.land.name; // 도로명
        // const roadNumber = data.land.number1;
        const region = [
          data.region.area1.name, // 시도
          data.region.area2.name, // 시군구
          data.region.area3.name, // 동읍면
          data.region.area4.name, // 상세주소
        ]
          .filter(Boolean)
          .join(" "); // 빈 값 제거 후 조합

        // 도로명 주소와 지역을 조합
        return `${region}`.trim();
      };
      const loadAddr = makeLoadAddr(res.results[0]);

      if (push_token) {
        const { area1, area2, area3, area4 } = res.results[0].region;

        const existingExpoToken = await prisma.expo_Token.findUnique({
          where: { token: push_token },
        });
        if (existingExpoToken) {
          await prisma.expo_Token.update({
            where: { token: push_token },
            data: {
              area1: area1.name,
              area2: area2.name,
              area3: area3.name,
              area4: area4.name,
            },
          });
        } else {
          await prisma.expo_Token.create({
            data: {
              token: push_token,
              area1: area1.name,
              area2: area2.name,
              area3: area3.name,
              area4: area4.name,
            },
          });
        }
      }

      const { area1, area2, area3, area4 } = res.results[0].region;

      return {
        loadAddr,
        area1: area1.name,
        area2: area2.name,
        area3: area3.name,
        area4: area4.name,
      };
    },
    kakaoLogin: async (_, { code, client_id, redirect_url, push_token }) => {
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
          if (userInfo.id) {
            const kakaoEmail = userInfo.kakao_account.email;
            const kakaoNickname = userInfo.kakao_account.profile.nickname;
            if (!kakaoEmail) {
              throw new Error(
                "카카오 내 인증된 이메일이 없으면 사용하실 수 없습니다."
              );
            }
            // 키카오 이메일로 서비스 db 조회
            let user = await prisma.user.findUnique({
              where: {
                email: kakaoEmail,
              },
            });
            console.log("[kakaoLogin]DB 기존 유저 발견:", user);

            if (!user) {
              // 없으면 [회원가입].
              user = await prisma.user.create({
                data: {
                  email: kakaoEmail,
                  kakaoId: userInfo.id,
                  push_token,
                  name: kakaoNickname,
                },
              });
              console.log("[kakaoLogin]newUser: ", user);
            } else {
              if (user.appleId) {
                console.log(
                  "[kakaoLogin]애플 계정으로 가입한 적이 있습니다. 해당 계정을 사용해주세요!"
                );
                // 카카오 계정이 잘 살아있을 때
                throw new Error(
                  "이미 가입한 애플 계정이 있습니다! 해당 계정을 사용해주세요🙇🏻‍♂️🙇🏻‍♂️"
                );
              }
            }

            // JWT 토큰 생성
            const token = generateToken(user);
            console.log("[kakaoLogin]", "id:", user.id, "token:", token);

            return { user, token }; // 유저 정보와 토큰 반환
          }
        }
        return null;
      } catch (e) {
        throw new Error(e);
      }
    },
    appleLogin: async (_, { name, id_token, push_token }) => {
      const { sub, email: appleEmail } = (jwt.decode(id_token) ?? {}) as {
        sub: string;
        email: string;
      };

      if (sub) {
        // 토큰 해독이 잘 됐다면?
        // 유저를 찾는다.
        let user = await prisma.user.findUnique({
          where: {
            email: appleEmail,
          },
        });
        console.log("[appleLogin]DB 기존 유저 발견:", user);

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: appleEmail,
              appleId: sub,
              push_token,
              name,
            },
          });
          console.log("[appleLogin]newUser: ", user);
        } else {
          if (user.kakaoId) {
            console.log("[appleLogin]카카오으로 가입한 계정이 있습니다.");
            // 카카오 계정이 잘 살아있을 때
            throw new Error(
              "이미 가입한 카카오 계정이 있습니다! 해당 계정을 사용해주세요🙇🏻‍♂️🙇🏻‍♂️"
            );
          }
        }

        // JWT 토큰 생성
        const token = generateToken(user);
        console.log("[appleLogin]", "id:", user.id, "token:", token);

        return { user, token }; // 유저 정보와 토큰 반환
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
    me: async (_, __, { user }) => {
      const foundUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      return foundUser;
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
    pureSignup: async (
      _,
      {
        email,
        password,
        push_token,
      }: { email: string; password: string; push_token?: string }
    ) => {
      // 이메일 중복 확인
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error("이미 사용 중인 이메일입니다!🤯");
      }

      // 비밀번호 해시화
      const hashedPassword = await bcrypt.hash(password, 10);

      // 유저 생성
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          push_token,
        },
      });

      const token = generateToken(user);

      return { user, token };
    },
    pureLogin: async (
      _,
      { email, password }: { email: string; password: string }
    ) => {
      // 유저 찾기
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error("이메일/비밀번호가 일치하지 않습니다.");
      }

      // 비밀번호 확인
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new Error("이메일/비밀번호가 일치하지 않습니다.");
      }

      const token = generateToken(user);

      return { user, token };
    },
    pureDeleteUser: async (_, __, { user }: Context) => {
      if (!user) {
        throw new Error("삭제할 유저가 존재하지 않습니다.");
      }

      // 유저 확인
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!existingUser) {
        throw new Error("토큰이 존재하지 않습니다.");
      }

      // 유저 삭제
      await prisma.user.delete({
        where: { id: user.id },
      });

      return { ok: true, error: null };
    },
    updateUserPassword: async (_, { oldPassword, newPassword }, { user }) => {
      try {
        // Ensure the user is authenticated
        if (!user) {
          throw new Error("You must be logged in to update your password.");
        }

        const userId = user.id;

        // Find the user in the database
        const existingUser = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error("User not found.");
        }
        if (existingUser.kakaoId || existingUser.appleId) {
          throw new Error("소셜로그인으로 가입된 계정입니다.");
        }

        // Check if the old password matches
        const isMatch = await bcrypt.compare(
          oldPassword,
          existingUser.password
        );
        if (!isMatch) {
          throw new Error("기존 비밀번호가 일치하지 않습니다.");
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user with the new password
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: { password: hashedPassword },
        });
        return { ok: true, error: null };
      } catch (e) {
        return { ok: false, error: e };
      }
    },
    sendAuthNumber: async (_, { phoneNumber }) => {
      const messageService = new SolapiMessageService(
        process.env.SOLAPI_API_KEY,
        process.env.SOLAPI_API_SECRET
      );

      // 이미 존재하는 번호인지 확인
      const existingUser = await prisma.user.findUnique({
        where: { phone: phoneNumber },
      });

      if (existingUser) {
        return { ok: false, error: "이미 해당 번호로 가입된 계정이 있습니다." };
      }

      // 인증번호 생성
      const authNumber = Math.floor(100000 + Math.random() * 900000).toString();
      // 인증번호를 데이터베이스에 저장
      await prisma.authNumber.create({
        data: {
          phoneNumber,
          authNumber,
        },
      });

      // 인증번호를 포함한 메시지 발송
      await messageService.send({
        to: phoneNumber,
        from: process.env.SOLAPI_SENDER_PHONE_NUMBER,
        text: `인증번호는 ${authNumber} 입니다.`,
      });

      return { ok: true, error: null };
    },
    verifyAuthNumber: async (_, { phoneNumber, authNumber }, { user }) => {
      // 데이터베이스에서 인증번호 조회
      const storedAuthNumber = await prisma.authNumber.findUnique({
        where: { phoneNumber },
      });

      if (!storedAuthNumber) {
        return { ok: false, error: "인증번호가 존재하지 않습니다." };
      }

      if (storedAuthNumber.authNumber !== authNumber) {
        return { ok: false, error: "인증번호가 일치하지 않습니다." };
      }

      // 인증번호가 일치하면 유저의 전화번호 업데이트
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: phoneNumber },
      });

      // 인증번호 삭제
      await prisma.authNumber.delete({
        where: { phoneNumber },
      });

      return { ok: true, error: null };
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
