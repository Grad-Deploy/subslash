import type { FAQ_EN } from "./faq-en";

/**
 * 도움말 FAQ의 독일어. 한국어 원문(`faq.ts`)과 id가 같고
 * 같은 사실만 적는다 — 한국어 답을 고치면 영어·이 파일도 함께 고친다.
 */
export const FAQ_GROUP_TITLES_DE: Record<string, string> = {
  시작하기: "Erste Schritte",
  "기록과 로그인": "Daten und Anmeldung",
  해지: "Kündigen",
  "알림과 가져오기": "Erinnerungen und Import",
  "AI에게 묻기": "Die KI fragen",
};

export const FAQ_DE: typeof FAQ_EN = {
  "what-is": {
    q: "Was macht SubSlash?",
    a: "Es zeigt, was jedes Abo pro Nutzung kostet (Kosten pro Nutzung), und führt dich dorthin, wo du die nicht lohnenden kündigen kannst. Trag deine Abos ein und gib an, wie oft du jedes in den letzten 30 Tagen genutzt hast – den Rest rechnet es aus.",
  },
  "cost-per-use": {
    q: "Wie werden die Kosten pro Nutzung berechnet?",
    a: "Dein monatlicher Anteil wird durch die Anzahl der Nutzungen der letzten 30 Tage geteilt. Bei geteilten Abos zählt nur dein Anteil, und Jahresabos werden zuerst auf einen Monatsbetrag umgerechnet. Abos ohne Eintrag haben keine Nutzungszahl, daher erfinden wir keine Kosten und zeigen „Noch kein Eintrag“.",
  },
  "exchange-rate": {
    q: "Wie werden in Dollar bezahlte Abos in Won umgerechnet? Kann ich den Wechselkurs ändern?",
    a: "Dollar-Abos werden mit dem Kurs umgerechnet, der in den Einstellungen unter „Wechselkurs“ steht. Bei „automatisch“ folgt er dem EZB-Referenzkurs (einmal pro Werktag aktualisiert); trägst du unter „Kurs ändern“ selbst einen ein, wird dieser Wert weiter verwendet. Abo-Belege und der Jahresrückblick, die vergangene Zahlungen zeigen, rechnen mit dem Referenzkurs des jeweiligen Zahlungstags statt mit dem heutigen. Der Referenzkurs ist nicht der Kurs, den deine Kartenfirma berechnet hat, daher können die Beträge leicht von deiner Kartenabrechnung abweichen. Der Bereich „Wechselkurs“ erscheint nur, solange du ein aktives Dollar-Abo hast.",
  },
  "checkin-auto": {
    q: "Kann ich Check-ins ausfüllen lassen, ohne selbst zu zählen?",
    a: "In der Android-App schaltest du in den Einstellungen „Handynutzung verbinden“ ein; sobald 30 Tage Nutzung der Abo-Apps auf diesem Handy zusammengekommen sind, checkt die App selbst ein. Im Web am PC öffnest du über den Link im Check-in-Fenster eines Claude-, ChatGPT-, Cursor- oder Google-AI-Abos die Seite zum Lesen der Daten und wählst den Datenordner eines KI-Coding-Tools oder eine claude.ai-Chatexportdatei. Die Nutzungstage werden gezählt und ins Check-in-Fenster eingetragen. Dateien werden an keinen Server gesendet, und gespeichert wird erst, wenn du bestätigst. In beiden Fällen zählt nur, was auf diesem Gerät bzw. in dieser Datei festgehalten ist – es kann also weniger sein als deine tatsächliche Nutzung.",
  },
  "where-stored": {
    q: "Wo werden meine Abo-Daten gespeichert?",
    a: "Standardmäßig nur auf diesem Gerät (im Browser oder in der App), ohne Übertragung an einen Server. Wenn du dich anmeldest, werden sie auch in deinem Konto gespeichert und automatisch mit deinen anderen angemeldeten Geräten abgeglichen.",
  },
  "lose-records": {
    q: "Verliere ich meine Daten, wenn ich das Gerät wechsle oder Browserdaten lösche?",
    a: "Ohne Anmeldung kann das passieren. Melde dich vorher an oder speichere eine Sicherungsdatei unter der Datensicherung in den Einstellungen. Auf dem neuen Gerät meldest du dich an oder lädst die Sicherungsdatei.",
  },
  "social-email-taken": {
    q: "Bei der Anmeldung mit Google, Kakao oder Naver steht „Es gibt bereits ein Konto“.",
    a: "Wenn mit dieser E-Mail zuerst ein Konto erstellt wurde, verbinden wir nicht automatisch, damit niemand anderes mit derselben Adresse hineinkommt. Melde dich mit der Methode an, mit der du dich registriert hast (E-Mail und Passwort oder die zuerst genutzte soziale Anmeldung), und verknüpfe die andere unter „Anmeldemethoden“ in Meine Daten. Danach öffnet diese Methode dasselbe Konto. Deine Daten bleiben in einem Konto, es gibt nichts zusammenzuführen oder zu löschen.",
  },
  "delete-records": {
    q: "Wie lösche ich meine Daten oder mein Konto?",
    a: "Lösche die Abo-Daten dieses Geräts mit dem vollständigen Zurücksetzen in den Einstellungen. Lösche dein Konto unter Meine Daten; die Daten auf diesem Gerät werden dabei nicht gelöscht und bleiben als Daten ohne Anmeldung.",
  },
  "cancel-in-app": {
    q: "Kann ich direkt in SubSlash kündigen?",
    a: "Nein. Gekündigt wird beim jeweiligen Dienst. SubSlash gibt dir den Link dorthin und den Menüweg. Wenn du fertig gekündigt hast und auf „Gekündigt“ tippst, wird es eingetragen — SubSlash kann nicht selbst prüfen, ob du gekündigt hast.",
  },
  "cancel-button-color": {
    q: "Was ist der Unterschied zwischen einem roten und einem umrandeten Kündigen-Button?",
    a: "Ein roter Button ist ein geprüfter Link direkt zur Kündigungsseite. Ein umrandeter Button führt zur Startseite oder Kontoseite; danach musst du das Kündigungsmenü anhand der Anleitung darunter finden.",
  },
  "store-billing-cancel": {
    q: "Wo kündige ich ein Abo, das über den App Store oder Google Play bezahlt wird?",
    a: "Kündige dort, wo du bezahlt hast. Wenn du als Zahlungsmethode „In-App-Kauf im Apple App Store“ oder „Google Play-Abo“ einträgst, zeigt die Kündigungshilfe zuerst diese Abo-Verwaltung.",
  },
  "billing-reminder": {
    q: "Kann ich vor dem Abbuchungstag erinnert werden?",
    a: ({ gmailOpen }) =>
      gmailOpen
        ? "In der App schaltest du in den Einstellungen „Zahlungserinnerungen auf diesem Gerät“ ein, dann wirst du auf diesem Handy erinnert. Im Web trägst du mit dem Button unter deiner Abo-Liste die Abbuchungstage in Google Kalender ein; sie werden zu Terminen und die Kalender-Benachrichtigungen erscheinen. Zahlungserinnerungen per E-Mail wurden eingestellt."
        : "In der App schaltest du in den Einstellungen „Zahlungserinnerungen auf diesem Gerät“ ein, dann wirst du auf diesem Handy erinnert. Zahlungserinnerungen per E-Mail wurden eingestellt.",
  },
  "gmail-unverified": {
    q: "Beim Verbinden von Gmail erscheint die Warnung „nicht verifizierte App“.",
    a: "Sie erscheint, weil Google die Verbindungs-App von SubSlash noch nicht geprüft hat. Fahr unter „Erweitert“ fort, dann wird verbunden. Wenn du keine Warnung sehen willst, installiere sie mit „Ohne Warnung selbst installieren (Skript kopieren)“ auf der Import-Seite in deinem eigenen Konto.",
  },
  "gmail-stored": {
    q: "Wird der Inhalt meiner Gmail-E-Mails in SubSlash gespeichert?",
    a: "Nein. Aus Zahlungs-E-Mails behalten wir nur Abo-Kandidaten wie Dienstname, Betrag und Abbuchungstag, niemals Betreff oder Inhalt. Du kannst jederzeit auf der Import-Seite trennen.",
  },
  "gmail-annual-missing": {
    q: "Ein Abo, das ich einmal im Jahr zahle, taucht im Import nicht auf.",
    a: "Beim Verbinden von Gmail prüfen wir zuerst die letzten 40 Tage, den Rest des Jahres in den folgenden Minuten. Öffne es gleich noch einmal. Fehlt es dann noch, wurde diese Zahlungs-E-Mail nicht gefunden – bitte trag es selbst ein.",
  },
  "ai-what-is-sent": {
    q: "Was wird gesendet, wenn ich die KI frage?",
    a: "Nur der Text deiner Frage geht an das KI-Unternehmen. Deine Abo-Liste und Beträge werden nicht gesendet — die KI wählt nur, welche Berechnung läuft oder welcher Hilfeeintrag angezeigt wird, und die Zahlen werden auf diesem Gerät berechnet. Schreib daher keine persönlichen Angaben wie Namen oder Kontaktdaten in die Frage.",
  },
  "ai-wrong-answer": {
    q: "Die KI zeigt eine falsche Antwort.",
    a: "Die KI wählt nur aus den vorbereiteten Berechnungen und Hilfeeinträgen; versteht sie die Frage falsch, zeigt sie eine andere Berechnung oder einen anderen Eintrag. Frag mit anderen Worten oder tippe unten auf eine der Fragen. Bleibt es falsch, schreib uns eine E-Mail.",
  },
};
