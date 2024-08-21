import dotenv from "dotenv";

dotenv.config();
import jwt from "jsonwebtoken";
const SECRET_KEY = process.env.JWT_SECRET_KEY;

export const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
    expiresIn: "1y", // 토큰 유효 기간 설정
  });
};
