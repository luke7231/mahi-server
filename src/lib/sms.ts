import pkg from "solapi";
const { SolapiMessageService } = pkg;
import dotenv from "dotenv";

// 환경 변수 로드
dotenv.config();

const messageService = new SolapiMessageService(
  process.env.SOLAPI_API_KEY as string,
  process.env.SOLAPI_API_SECRET as string
);

export async function sendSMS(to: string, text: string) {
  try {
    const response = await messageService.send({
      from: process.env.SOLAPI_SENDER_PHONE_NUMBER as string,
      to,
      text,
    });
    console.log("Message sent successfully:", response);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

export async function sendAlimTalk(
  to: string,
  templateCode: string,
  variables: Record<string, string>
) {
  if (!to.startsWith("010")) {
    console.error("Error: The recipient's phone number must start with 010.");
    return;
  }

  try {
    const response = await messageService.send({
      from: process.env.SOLAPI_SENDER_PHONE_NUMBER as string,
      to,
      kakaoOptions: {
        pfId: "KA01PF250115005943669TDs6evUirDK", // 플러스친구 ID
        templateId: templateCode, // 템플릿 코드
        variables, // 템플릿 변수
      },
    });
  } catch (error) {
    console.error("Error sending AlimTalk:", error);
  }
}

export async function sendPaymentCompletionAlimTalkToSeller({
  sellerPhoneNumber,
  productName,
  customerName,
  customerContact,
  pickUpTime,
}: {
  sellerPhoneNumber: string;
  productName: string;
  customerName: string;
  customerContact: string;
  pickUpTime: string;
}) {
  await sendAlimTalk(sellerPhoneNumber, "KA01TP250115015841802dqUXatoPFbq", {
    "#{상품명}": productName,
    "#{주문고객이름}": customerName || "이름을 찾을 수 없습니다",
    "#{고객연락처}": customerContact,
    "#{도착예정시간}": pickUpTime,
  });
}
