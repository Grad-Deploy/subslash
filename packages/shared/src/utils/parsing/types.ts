/** 어느 시간대의 달력으로 본 날짜. */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

/**
 * 메일 한 통을 읽을 때 문자보다 더 아는 것.
 *
 * 문자는 짧아서 본문 전체가 판단 근거지만, 메일 본문에는 광고·약관·하단 안내가 섞인다.
 * "언제든 해지할 수 있습니다"가 모든 영수증을 해지 알림으로, "1.5GB"가 결제일 5일로 읽히지
 * 않도록 판단마다 믿을 곳을 따로 준다.
 */
export interface ReceiptHints {
  /** 메일 제목. 해지 여부와 서비스 이름을 여기서 먼저 본다. */
  subject: string;
  /** 보낸 사람. 도메인이 서비스와 맞으면 제목·본문보다 믿을 만한 근거다. */
  sender: string;
  /** 메일 본문. 서비스 이름을 마지막으로 찾아볼 곳이다. */
  body: string;
  /** 본문에 결제일 칸이 없을 때 쓸 날짜. 메일에서는 받은 날(사용자 시간대의 달·일)이다. */
  received: CalendarDate;
  /**
   * 이 조각이 어느 서비스의 것인지 이미 정해졌을 때의 프리셋 id.
   *
   * 한 통으로 여러 앱을 청구하는 영수증을 항목별로 쪼갤 때만 쓴다(`splitPlatformReceipt`).
   * 조각에는 그 앱의 이름·금액·주기만 들어 있으므로, 이름을 다시 찾게 두면 키워드 표에서
   * 앞선 서비스가 조각을 가로챈다.
   */
  forcedPresetId?: string;
}
