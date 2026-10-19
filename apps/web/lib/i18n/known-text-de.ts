import {
  nameIn,
  type BackupFieldNames,
  type BackupListNames,
  type KnownTextRender,
  type WaitUnitNames,
} from "./known-text-types";

/**
 * `known-text`의 독일어. 규칙(정규식)은 `known-text`의 영어 표에
 * 한 벌만 있고, 여기는 **같은 순서의** 번역 함수만 둔다 — 순서·개수가 어긋나면 테스트가 잡는다.
 */

const BACKUP_LISTS: BackupListNames = {
  구독: "Abo",
  "체크인 기록": "Eintrag",
  "연동 계정": "verknüpften Konto",
};
const BACKUP_FIELDS: BackupFieldNames = {
  형식: "Format",
  ID: "ID",
  이름: "Name",
  금액: "Betrag",
  통화: "Währung",
  결제일: "Abbuchungstag",
  "결제 주기": "Abbuchungsintervall",
  "결제 월": "Abbuchungsmonat",
  카테고리: "Kategorie",
  상태: "Status",
  등록일: "Hinzufügedatum",
  해지일: "Kündigungsdatum",
  "숨긴 날": "Ausblendedatum",
  "요금 확인일": "Preisprüfdatum",
  "함께 쓰는 사람 수": "Anzahl der Teilenden",
  "내 몫": "Mein Anteil",
  "결제 수단": "Zahlungsmethode",
  "해지 링크": "Kündigungslink",
  "해지 안내": "Kündigungshilfe",
  아이콘: "Symbol",
  "아이콘 색": "Symbolfarbe",
  요금제: "Tarif",
  "요금제 이름": "Tarifname",
  세금: "Steuer",
  "연동 계정": "Verknüpftes Konto",
  "연동 계정 이름": "Name des verknüpften Kontos",
  메모: "Notiz",
  "무료 요금제로 충분했는지": "Ob der kostenlose Tarif gereicht hätte",
  "토큰 사용량": "Genutzte Tokens",
  "체크인 기기": "Check-in-Gerät",
  "다시 살펴볼 날": "Wiedervorlagedatum",
  "해지 기록": "Kündigungseintrag",
  "주문 메일 근거": "Beleg aus Bestell-E-Mails",
  "결제 메일 기록": "Verlauf der Zahlungs-E-Mails",
  "구독 ID": "Abo-ID",
  월: "Monat",
  "사용 횟수": "Anzahl der Nutzungen",
  "1회당 비용": "Kosten pro Nutzung",
  위험도: "Risikostufe",
  "체크인 시각": "Eintragszeit",
  "체크인 출처": "Eintragsquelle",
  "체크인 지표": "Eintragskennzahl",
  "로그인 제공자": "Anmeldeanbieter",
  칭호: "Titel",
  "이메일/ID": "E-Mail/ID",
  색: "Farbe",
};
const UNITS: WaitUnitNames = { 초: "Sekunden", 분: "Minuten", 시간: "Stunden" };

export const KNOWN_TEXT_DE: KnownTextRender[] = [
  // 아이디
  () => "Gib einen Benutzernamen ein.",
  (min, max) => `Der Benutzername muss ${min}–${max} Zeichen lang sein.`,
  () => "Der Benutzername darf nur Kleinbuchstaben, Ziffern und Unterstriche (_) enthalten.",
  () => "Gib deinen Benutzernamen oder deine E-Mail ein.",
  () => "Dieser Benutzername ist bereits vergeben.",
  () => "Das Format passt. Ob der Benutzername frei ist, wird bei der Registrierung geprüft.",
  // Gmail 가져오기
  () =>
    "Die importierten E-Mails konnten nicht gelesen werden. Tippe erneut auf den Button im Apps-Script-Fenster.",
  // 서비스 주소
  () => "Prüf die Adresse (z. B. service.com).",
  // 이메일
  () => "Gib deine E-Mail-Adresse ein.",
  () => "Die E-Mail-Adresse ist zu lang.",
  () => "Die E-Mail-Adresse ist ungültig (z. B. you@example.com).",
  () => "Die E-Mail-Adresse ist ungültig. Prüf die Domain nach dem @ (z. B. gmail.com, naver.com).",
  (s) => `Die E-Mail-Adresse sieht falsch aus. Meintest du ${s}?`,
  () =>
    "Mit dieser E-Mail ist keine Registrierung möglich. Nutze eine gängige Adresse wie naver.com, gmail.com oder daum.net.",
  () => "Die E-Mail passt. Ob sie schon verwendet wird, wird bei der Registrierung geprüft.",
  () => "Diese E-Mail wird bereits verwendet.",
  () => "Ein Konto mit dieser E-Mail wartet bereits auf die Bestätigung.",
  // 비밀번호
  () => "Gib ein Passwort ein.",
  (more, min) => `Noch ${more} Zeichen (mindestens ${min}).`,
  (max) => `Das Passwort darf höchstens ${max} Zeichen lang sein.`,
  () => "Das Passwort darf nicht aus einem einzigen wiederholten Zeichen bestehen.",
  () => "Das Passwort ist zu lang.",
  () => "Gib das Passwort erneut ein.",
  () => "Die Passwörter stimmen nicht überein.",
  () => "Die Passwörter stimmen nicht überein.",
  () => "Die Passwörter stimmen überein.",
  () => "Das Passwort passt.",
  // 만 14세
  (age) => `Bestätige, dass du mindestens ${age} Jahre alt bist.`,
  // 서버 응답
  () => "Die Anfrage war nicht verständlich.",
  () => "Prüf deine Eingaben.",
  () => "Benutzername oder Passwort ist falsch.",
  () => "Anmeldung nicht möglich.",
  () => "Einige Angaben werden bereits verwendet.",
  () => "Die Registrierung konnte nicht abgeschlossen werden.",
  (m) => `Zu viele Anfragen. Versuch es in ${m} Minute(n) erneut.`,
  () => "Zu viele Anfragen. Versuch es gleich erneut.",
  // 확인 메일
  (email) =>
    `Wir haben eine Bestätigungs-E-Mail an ${email} gesendet. Wenn sie nicht im Posteingang ist, schau im Spam nach.`,
  (n, unit) =>
    `An diese Adresse wurden zu oft E-Mails gesendet. Du kannst in ${n} ${nameIn(UNITS, unit)} erneut senden.`,
  () =>
    "Auf diesem Server ist der E-Mail-Versand nicht eingerichtet, daher konnte keine Bestätigung gesendet werden.",
  () => "Die Bestätigungs-E-Mail konnte nicht gesendet werden. Versuch es gleich erneut.",
  () => "Die Bestätigungs-E-Mail konnte nicht gesendet werden.",
  // 비밀번호 재설정 메일
  (email, m) =>
    `Wir haben eine E-Mail zum Zurücksetzen des Passworts an ${email} gesendet. Der Link funktioniert einmal innerhalb von ${m} Minuten. Wenn sie nicht im Posteingang ist, schau im Spam nach.`,
  (n, unit) =>
    `An diese Adresse wurden zu oft E-Mails gesendet. Du kannst es in ${n} ${nameIn(UNITS, unit)} erneut anfordern.`,
  () =>
    "Auf diesem Server ist der E-Mail-Versand nicht eingerichtet, daher konnte keine Zurücksetzen-E-Mail gesendet werden.",
  () => "Die Zurücksetzen-E-Mail konnte nicht gesendet werden. Fordere sie gleich erneut an.",
  () => "Die Zurücksetzen-E-Mail konnte nicht gesendet werden.",
  () => "Mit dieser E-Mail ist kein Konto registriert.",
  // 내 정보·비밀번호·탈퇴·로그인 방법
  () => "Du musst dich anmelden.",
  () => "Gib dein aktuelles Passwort ein.",
  () => "Das aktuelle Passwort ist falsch.",
  () => "Wähl ein anderes Passwort als das aktuelle.",
  () =>
    "Das Passwort wurde bereits anderswo geändert. Melde dich mit dem neuen Passwort erneut an.",
  () => "Das Passwort konnte nicht geändert werden. Versuch es gleich erneut.",
  () => "Das Passwort konnte nicht geändert werden.",
  () => "Das Passwort ist falsch.",
  () => "Der Zurücksetzen-Link konnte nicht verarbeitet werden.",
  () => "Der Bestätigungslink konnte nicht verarbeitet werden.",
  () => "Dieses Konto ist bereits bestätigt und kann mit diesem Link nicht gelöscht werden.",
  () => "Das Konto konnte nicht gelöscht werden. Versuch es gleich erneut.",
  () => "Gib 'DELETE' zur Bestätigung ein.",
  () => "Die Anmeldemethoden konnten nicht geladen werden.",
  () => "Verknüpfen konnte nicht gestartet werden.",
  () => "Trennen fehlgeschlagen.",
  () => "Bereits verknüpft.",
  () => "Verknüpfen ist gerade nicht möglich.",
  () =>
    "Das ist deine einzige Anmeldemethode und kann nicht getrennt werden. Leg zuerst ein Passwort an oder verknüpfe ein anderes Konto.",
  // Gmail 자동 가져오기
  () => "Diese Funktion ist noch nicht gestartet.",
  () => "Der Verbindungsstatus konnte nicht gelesen werden.",
  () => "Es konnte kein Verbindungstoken erstellt werden.",
  () => "Die Gmail-Verbindung konnte nicht gestartet werden.",
  () => "Die Ein-Klick-Verbindung ist nicht eingerichtet. Installier das Skript selbst.",
  () => "Die gefundenen Abos konnten nicht gelesen werden.",
  () => "Die gefundenen Abos konnten nicht gelöscht werden.",
  // 구글 캘린더 등록
  () => "Auf diesem Server ist die Google-Kalender-Synchronisierung nicht eingerichtet.",
  () => "Die gesendete Abo-Liste konnte nicht gelesen werden.",
  () => "Es gibt keine Abos für den Kalender.",
  () => "Die Kalender-Synchronisierung konnte nicht gestartet werden.",
  // 여러 기기 사용 측정
  () => "Die Einstellungen für den Zugriff auf Nutzungsdaten konnten nicht geöffnet werden.",
  () => "Die Nutzungsdaten konnten nicht hochgeladen werden.",
  () => "Die Nutzungsdaten konnten nicht gelesen werden.",
  () => "Die gesendeten Nutzungsdaten konnten nicht gelesen werden.",
  () => "Die Nutzungsdaten konnten nicht gespeichert werden.",
  () => "Die Nutzungsdaten konnten nicht gelöscht werden.",
  // 토큰·기록 지우기
  () => "Das Token fehlt.",
  () => "Der Eintrag konnte nicht gelöscht werden.",
  // 물어보기·도움말 AI
  () => "Diese Funktion ist noch nicht bereit.",
  () => "Gerade ist keine Antwort möglich.",
  () => "Gerade ist keine Antwort möglich. Frag gleich noch einmal.",
  () => "Gib eine Frage ein.",
  (max) => `Die Frage darf höchstens ${max} Zeichen lang sein.`,
  () => "Gerade kommen viele Fragen. Frag gleich noch einmal.",
  // 계정 저장
  () => "Im Konto sind keine Daten gespeichert.",
  () => "Die im Konto gespeicherten Daten konnten nicht gelesen werden.",
  () => "Die Daten sind zu groß für das Konto. Speichere stattdessen eine Sicherungsdatei.",
  () => "Speichern im Konto fehlgeschlagen.",
  () => "Die im Konto gespeicherten Daten konnten nicht gelöscht werden.",
  () => "Ein anderes Gerät hat die Kontodaten zuvor geändert.",
  () =>
    "Auf diesem Server ist keine Datenbank eingerichtet, daher sind die Kontofunktionen nicht verfügbar. Deine Abo-Liste bleibt in diesem Browser.",
  // 백업 파일 복원
  () => "Das ist keine JSON-Datei. Wähl eine aus SubSlash gespeicherte Sicherungsdatei.",
  () => "Das ist keine SubSlash-Sicherungsdatei.",
  () => "Die Formatversion der Sicherung ist nicht erkennbar.",
  () =>
    "Diese Sicherung hat ein neueres Format als die App. Lade die Seite neu und versuch es erneut.",
  () => "Die Sicherungsdatei muss die Listen der Abos, Einträge und verknüpften Konten enthalten.",
  (list, index, field) =>
    `Das Feld „${nameIn(BACKUP_FIELDS, field)}“ im ${nameIn(BACKUP_LISTS, list)} Nr. ${index} ist ungültig.`,
  (index) => `Abo Nr. ${index} hat dieselbe ID wie ein anderes Abo.`,
  () => "Die Wechselkurs-Einstellung ist ungültig.",
  () => "Prüfe das Format der E-Mail-Adresse.",
  () => "Diese E-Mail-Adresse ist bereits bestätigt.",
];
