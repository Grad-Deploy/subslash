import type { Widen } from "../types";

/**
 * 개인정보처리방침 화면의 안내. 번역판이 없는 언어는 영어판을 보이므로(PrivacyPolicy), 그 언어로 영어판이라고
 * 먼저 알린다 — 알리지 않으면 왜 이 화면만 영어인지, 어느 판이 우선하는지 알 수 없다. 한국어·영어는 자기 판이
 * 있어 이 문구를 보이지 않는다.
 */
export const ko = {
  privacyPage: {
    englishOnly:
      "이 언어로 옮긴 방침이 아직 없어 영어판을 보여 드려요. 영어판과 한국어판(원문)이 다르면 한국어판이 우선합니다.",
  },
};

export const en: Widen<typeof ko> = {
  privacyPage: {
    englishOnly:
      "This policy isn't available in this language yet, so the English version is shown. If the English and Korean (original) versions differ, the Korean version applies.",
  },
};

export const zh: Widen<typeof ko> = {
  privacyPage: {
    englishOnly: "本政策暂无中文版，因此显示英文版。英文版与韩文版（原文）不一致时，以韩文版为准。",
  },
};

export const ja: Widen<typeof ko> = {
  privacyPage: {
    englishOnly:
      "このポリシーにはまだ日本語版がないため、英語版を表示しています。英語版と韓国語版（原文）が異なる場合は韓国語版が優先されます。",
  },
};

export const vi: Widen<typeof ko> = {
  privacyPage: {
    englishOnly:
      "Chính sách này chưa có bản tiếng Việt nên đang hiển thị bản tiếng Anh. Nếu bản tiếng Anh và bản tiếng Hàn (bản gốc) khác nhau, bản tiếng Hàn được ưu tiên.",
  },
};

export const fr: Widen<typeof ko> = {
  privacyPage: {
    englishOnly:
      "Cette politique n'est pas encore disponible en français : la version anglaise est affichée. En cas de différence entre la version anglaise et la version coréenne (originale), la version coréenne prévaut.",
  },
};

export const es: Widen<typeof ko> = {
  privacyPage: {
    englishOnly:
      "Esta política aún no está disponible en español, así que se muestra la versión en inglés. Si la versión en inglés y la coreana (original) difieren, prevalece la coreana.",
  },
};

export const de: Widen<typeof ko> = {
  privacyPage: {
    englishOnly:
      "Diese Erklärung gibt es noch nicht auf Deutsch, daher wird die englische Fassung angezeigt. Weichen die englische und die koreanische Fassung (Original) voneinander ab, gilt die koreanische.",
  },
};

export const pt: Widen<typeof ko> = {
  privacyPage: {
    englishOnly:
      "Esta política ainda não está disponível em português, por isso a versão em inglês é exibida. Se a versão em inglês e a coreana (original) forem diferentes, vale a coreana.",
  },
};
