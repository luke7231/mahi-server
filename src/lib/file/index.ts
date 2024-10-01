import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

export interface S3UploadPayload {
  Bucket: string;
  ETag: string;
  Key: string;
  Location: string;
  ServerSideEncryption: string;
  key: string;
}

export const removeExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return filename; // 파일 이름에 확장자가 없는 경우
  }
  return filename.substring(0, lastDotIndex);
};

const KEY = process.env.AWS_KEY;
const SECRET_KEY = process.env.AWS_SECRET_KEY;

const s3 = new AWS.S3({
  accessKeyId: KEY,
  secretAccessKey: SECRET_KEY,
  region: "ap-northeast-2",
});

export const uploadToS3 = async (file, tag) => {
  // file이 Promise인 경우 먼저 resolve해야 합니다.
  const { createReadStream, filename, mimetype } = await file;

  const stream = createReadStream(); // 파일 스트림 생성

  const params = {
    Bucket: "mahi-img", // S3 버킷 이름
    Key: `${Date.now()}-${filename}`, // S3에 저장될 파일 이름
    Body: stream, // 파일 스트림
    ContentType: mimetype, // 파일의 MIME 타입 (예: image/png)
    ACL: "public-read", // S3 파일 공개 설정
  };

  const result = await s3.upload(params).promise();
  return result.Location; // 업로드된 파일의 URL을 반환
};
