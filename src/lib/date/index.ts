export function isCreatedToday(timestamp: Date | string | number) {
  // 주어진 타임스탬프를 Date 객체로 변환
  const givenDate = new Date(timestamp);

  // 현재 날짜 정보를 가져옴
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  // 주어진 날짜가 오늘 범위 안에 있는지 확인
  return givenDate >= todayStart && givenDate < tomorrowStart;
}
