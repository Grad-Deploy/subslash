import type { Widen } from "../types";

/** 구독 상세의 '금액 변경 기록'(`AmountHistoryCard`, utils/amountHistory). */
export const ko = {
  amountHistory: {
    title: "금액 변경 기록",
    note: "직접 고친 금액이에요. 고친 날부터 새 금액으로 보고, 그 전의 결제는 고치기 전 금액으로 영수증에 셈해요.",
    shared: "나눠 내기를 바꿨어요",
  },
};

export const en: Widen<typeof ko> = {
  amountHistory: {
    title: "Amount changes",
    note: "Amounts you changed yourself. A new amount counts from the day you changed it; earlier payments use the earlier amount on receipts.",
    shared: "Changed how it's split",
  },
};

export const zh: Widen<typeof ko> = {
  amountHistory: {
    title: "金额修改记录",
    note: "这是你自己修改的金额。新金额从修改当天起算，之前的付款在收据中按修改前的金额计算。",
    shared: "修改了分摊方式",
  },
};

export const ja: Widen<typeof ko> = {
  amountHistory: {
    title: "金額の変更記録",
    note: "あなたが変更した金額です。新しい金額は変更した日からとみなし、それ以前の支払いはレシートで変更前の金額で計算します。",
    shared: "割り勘を変更しました",
  },
};

export const vi: Widen<typeof ko> = {
  amountHistory: {
    title: "Lịch sử đổi số tiền",
    note: "Đây là số tiền bạn tự sửa. Số tiền mới được tính từ ngày sửa; các khoản trước đó được tính theo số tiền cũ trên biên lai.",
    shared: "Đã đổi cách chia tiền",
  },
};

export const fr: Widen<typeof ko> = {
  amountHistory: {
    title: "Changements de montant",
    note: "Montants que vous avez modifiés vous-même. Le nouveau montant compte à partir du jour de la modification ; les paiements antérieurs utilisent l'ancien montant sur les reçus.",
    shared: "Partage modifié",
  },
};

export const es: Widen<typeof ko> = {
  amountHistory: {
    title: "Cambios de importe",
    note: "Importes que cambiaste tú. El nuevo importe cuenta desde el día del cambio; los pagos anteriores usan el importe anterior en los recibos.",
    shared: "Cambiaste el reparto",
  },
};

export const de: Widen<typeof ko> = {
  amountHistory: {
    title: "Betragsänderungen",
    note: "Beträge, die du selbst geändert hast. Der neue Betrag gilt ab dem Tag der Änderung; frühere Zahlungen werden in Belegen mit dem früheren Betrag berechnet.",
    shared: "Aufteilung geändert",
  },
};

export const pt: Widen<typeof ko> = {
  amountHistory: {
    title: "Alterações de valor",
    note: "Valores que você mesmo alterou. O novo valor conta a partir do dia da alteração; pagamentos anteriores usam o valor antigo nos recibos.",
    shared: "Divisão alterada",
  },
};
