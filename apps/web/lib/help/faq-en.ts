/**
 * 도움말 FAQ의 영어. 한국어 원문(`faq.ts`)과 id가 같고, 같은 사실만 적는다 — 하지 않는 일을 하는 것처럼 적지 않는다
 * (CLAUDE.md '제1원칙'). 한국어 답을 고치면 여기도 함께 고친다. 서비스 이름과 화면 이름은 영어 화면의 말을 쓴다.
 * `a`가 함수인 항목은 열린 기능에 따라 답이 달라지는 항목이다.
 */
export interface FaqOptions {
  gmailOpen: boolean;
  socialOpen: boolean;
  aiOpen: boolean;
}

export const FAQ_GROUP_TITLES_EN: Record<string, string> = {
  시작하기: "Getting started",
  "기록과 로그인": "Records and login",
  해지: "Cancelling",
  "알림과 가져오기": "Reminders and importing",
  "AI에게 묻기": "Ask the AI",
};

export const FAQ_EN: Record<string, { q: string; a: string | ((options: FaqOptions) => string) }> =
  {
    "what-is": {
      q: "What does SubSlash do?",
      a: "It shows what each subscription costs per use (cost per use) and guides you to where you can cancel the ones that aren't worth it. Add your subscriptions and check in how many times you used each one in the last 30 days, and it works it out.",
    },
    "cost-per-use": {
      q: "How is the cost per use calculated?",
      a: "Your monthly share is divided by the number of times you used it in the last 30 days. For subscriptions split with others only your share counts, and yearly subscriptions are divided into a monthly amount first. Subscriptions you haven't checked in on don't have a usage count, so we don't make up a cost and show “No check-in yet”.",
    },
    "where-stored": {
      q: "Where are my subscription records stored?",
      a: "By default they're stored only on this device (in the browser or app) and aren't sent to a server. If you log in, your records are also stored in your account and automatically kept in sync with your other logged-in devices.",
    },
    "lose-records": {
      q: "Will I lose my records if I change devices or clear browser data?",
      a: "If you aren't logged in, you can. Log in beforehand, or save a backup file under “Backup · Save to account” in Settings. On the new device, log in or load the backup file.",
    },
    "social-email-taken": {
      q: "Logging in with Google, Kakao or Naver says “An account already exists”.",
      a: "If an account was first created with that email, we don't merge automatically, so nobody else can get into it using the same address. Log in with the method you first signed up with (email and password, or the social login you used first), then link the other method under “Login methods” in My info. From then on that method opens the same account. Your records stay in one account, so there is nothing to merge or delete.",
    },
    "delete-records": {
      q: "How do I delete my records or leave?",
      a: "Delete this device's subscription records with “Reset everything” in Settings. Delete your account with “Delete account” in My info; the records on this device aren't deleted then, and remain as records of a logged-out user.",
    },
    "cancel-in-app": {
      q: "Can I cancel right in SubSlash?",
      a: "No. You cancel in each service. SubSlash gives you the link to where you cancel and the menu path. Once you've finished cancelling and tap “I cancelled”, it's recorded as cancelled — SubSlash can't check by itself whether you cancelled.",
    },
    "cancel-button-color": {
      q: "What's the difference between a red cancel button and an outlined one?",
      a: "A red button is a link confirmed to go straight to the cancel page. An outlined button goes to the home page or account page, so after that you need to find the cancel menu by following the guide below.",
    },
    "store-billing-cancel": {
      q: "Where do I cancel a subscription paid through the App Store or Google Play?",
      a: "Cancel where you paid. If you set the subscription's payment method to “Apple App Store in-app purchase” or “Google Play subscription”, the cancel guide shows that subscription management screen first.",
    },
    "billing-reminder": {
      q: "Can I get a reminder before the billing date?",
      a: ({ gmailOpen }) =>
        gmailOpen
          ? "In the app, turn on “Payment reminders on this device” in Settings and it notifies this phone. On the web, use “Add billing dates to Google Calendar” below your subscription list to put billing dates in your calendar as events, and calendar notifications appear. Email payment reminders have ended."
          : "In the app, turn on “Payment reminders on this device” in Settings and it notifies this phone. Email payment reminders have ended.",
    },
    "gmail-unverified": {
      q: "An “unverified app” warning appears when I connect Gmail.",
      a: "This warning appears because SubSlash's connection app hasn't been reviewed by Google yet. Continue under “Advanced” and it connects. If you'd rather not see a warning, install it in your own account with “Install it yourself without the warning (copy the script)” on the import screen.",
    },
    "gmail-stored": {
      q: "Is the content of my Gmail emails stored in SubSlash?",
      a: "No. From payment emails we only keep subscription candidates such as the service name, amount and billing date, and never store email subjects or bodies. You can disconnect any time on the import screen.",
    },
    "gmail-annual-missing": {
      q: "A subscription I pay once a year doesn't show up in the import.",
      a: "When you connect Gmail we check the last 40 days of email first, and the rest of the year is checked over the next few minutes. Open it again in a moment. If it's still missing, that payment email wasn't found, so please add it yourself.",
    },
    "ai-what-is-sent": {
      q: "What gets sent when I ask the AI?",
      a: "Only the question text you wrote goes to the AI company. Your subscription list and amounts are not sent — the AI only chooses which calculation to run or which help entry to show, and the numbers are worked out on this device. So please don't put personal details such as your name or contacts in the question.",
    },
    "ai-wrong-answer": {
      q: "The AI shows a wrong answer.",
      a: "The AI only chooses from the calculations and help entries we've set up, so if it misreads the question it can show a different calculation or entry. Ask again in different words, or tap one of the question buttons below. If it keeps being wrong, tell us by email.",
    },
  };
