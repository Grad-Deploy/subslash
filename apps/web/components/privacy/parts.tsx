import React from "react";

/** "2026-10-01" → "2026년 10월 1일". */
export function koreanDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-10-01" 또는 "2026년 10월 1일" → "October 1, 2026". 읽지 못하면 받은 그대로. */
export function englishDate(date: string): string {
  const match = /^(\d{4})(?:-|년\s*)(\d{1,2})(?:-|월\s*)(\d{1,2})일?$/.exec(date.trim());
  if (!match) return date;
  const [, year, month, day] = match;
  return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`;
}

/**
 * 권익침해 구제를 맡는 기관. 번호와 주소는 각 기관이 안내하는 값이고, 확인하지 못한 값은
 * 적지 않는다 — 도움을 받으려는 사람이 엉뚱한 곳으로 가면 안 된다. 영어 이름은 각 기관이 영문 사이트에서
 * 쓰는 이름이다.
 */
export const REMEDY_BODIES = [
  {
    name: "개인정보분쟁조정위원회",
    nameEn: "Personal Information Dispute Mediation Committee",
    role: "분쟁 조정 신청, 집단분쟁조정",
    roleEn: "Dispute mediation, collective dispute mediation",
    phone: "1833-6972",
    url: "https://www.kopico.go.kr",
  },
  {
    name: "개인정보침해신고센터",
    nameEn: "Personal Information Infringement Report Center (KISA)",
    role: "침해 사실 신고, 상담",
    roleEn: "Reporting infringements, counseling",
    phone: "118",
    url: "https://privacy.kisa.or.kr",
  },
  {
    name: "대검찰청 사이버수사과",
    nameEn: "Supreme Prosecutors' Office, Cyber Investigation Division",
    role: "형사 사건 고소·상담",
    roleEn: "Criminal complaints, counseling",
    phone: "1301",
    url: "https://www.spo.go.kr",
  },
  {
    name: "경찰청 사이버수사국",
    nameEn: "Korean National Police Agency, Cyber Bureau",
    role: "형사 사건 신고·상담",
    roleEn: "Criminal reports, counseling",
    phone: "182",
    url: "https://ecrm.cyber.go.kr/minwon/main",
  },
] as const;

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}
