export type Resolver<A, R, C> = (parent, args: A, context: C, info) => R;

export interface AuthResponse {
  authResultCode: string; // 인증 결과 코드
  authResultMsg: string; // 인증 결과 메시지
  tid: string; // 거래 ID
  clientId: string; // 클라이언트 ID
  orderId: string; // 주문 ID
  amount: string; // 결제 금액
  authToken: string; // 인증 토큰
  signature: string; // 서명
  mallReserved: string;
}
