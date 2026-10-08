import React from "react";
import Link from "next/link";
import {
  ANONYMOUS_STATS_STARTS_ON,
  STATS_AGE_BAND_STARTS_ON,
  DEVICE_USAGE_STARTS_ON,
  GMAIL_AUTO_IMPORT_STARTS_ON,
  GMAIL_CHARGE_HISTORY_STARTS_ON,
  SOCIAL_LOGIN_STARTS_ON,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_OFFICER,
} from "@lib/privacy";
import { storageQuotaWebAppUrl } from "@lib/storage-quota";
import { Item, REMEDY_BODIES, Section, englishDate } from "./parts";

/**
 * 개인정보처리방침의 영어판. 한국어판(PrivacyKo)을 그대로 옮긴 것이고, 항목·조건(시작일 상수)·순서가 같아야
 * 한다 — 한쪽만 고치면 영어로 읽는 사람이 다른 방침을 읽게 된다. 둘이 다르면 한국어판이 우선한다고 적는다.
 */
export function PrivacyEn() {
  const effective = englishDate(PRIVACY_EFFECTIVE_DATE);
  return (
    <article className="mx-auto max-w-2xl space-y-8 py-6 text-sm leading-relaxed">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-black tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground">Effective: {effective}</p>
        <p className="text-muted-foreground">
          SubSlash stores your subscription records only on this device by default. Personal
          information is stored on our server only when you use a feature you choose, such as
          logging in, saving to your account
          {GMAIL_AUTO_IMPORT_STARTS_ON && ", Gmail auto import"}
          {ANONYMOUS_STATS_STARTS_ON && ", anonymous subscription statistics"}
          {DEVICE_USAGE_STARTS_ON && ", multi-device usage measurement"}
          {SOCIAL_LOGIN_STARTS_ON && ", or logging in with Google, Kakao, or Naver"}. When you log
          in, your subscription records are saved to your account automatically (you can turn this
          off on each device). Below we describe what we store, why, and for how long.
        </p>
        <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
          This is a translation of the Korean policy for your convenience. If the two differ, the{" "}
          Korean version applies.
        </p>
      </header>

      <Section title="1. Personal information we process and why">
        <Item title="Using SubSlash without logging in">
          Subscription, check-in, and savings records (including the sign-up account you note for
          each subscription) are stored only in this browser&rsquo;s storage (in the app, this
          device&rsquo;s storage) and are not sent to our server.
        </Item>
        <Item title="Finding subscriptions in Gmail (optional)">
          An Apps Script you create in your own Google account uses mail read permission to find the
          sender, subject, received time, and the beginning of the body of recent payment emails.
          This content is placed after the &lsquo;#&rsquo; in a SubSlash address and read only
          inside your browser; it is not sent to or stored on the SubSlash server. Subscriptions you
          register are stored in your browser as described above. If you have already registered a
          membership (Coupang WOW), only the number of order emails from the last 30 days is written
          to that subscription&rsquo;s record and shown as evidence when you enter its benefits
          (email subjects and contents are not kept). For earlier payment emails from the same
          service, only the received date and amount are written to that subscription&rsquo;s record
          and used to fill subscription receipts for months before you registered it.
        </Item>
        {SOCIAL_LOGIN_STARTS_ON && (
          <Item
            title={`Log in with Google, Kakao, or Naver (optional, from ${englishDate(SOCIAL_LOGIN_STARTS_ON)})`}
          >
            When you tap &lsquo;Continue with Google&rsquo; or similar on the login or sign-up
            screen, we receive, from that company&rsquo;s login screen (for Kakao login in the
            Android app, the KakaoTalk app), the email address you agreed to share and that
            company&rsquo;s member number. The member number is stored only as an irreversible hash
            and used to recognize you at your next login; the email is stored as your
            account&rsquo;s email. On first login we create an account with a random username and
            store no password. We do not receive your name, profile photo, or phone number, and the
            access token the company gives us is used only once to read your email and is not
            stored. If the company does not tell us it has verified the email (Naver), we send a
            confirmation email to that address as with sign-up. If an account already exists with
            the same email, we do not link the two accounts and refuse the login. When a logged-in
            user chooses to connect a method under &lsquo;My account&rsquo; › Login methods, we add
            the hash of the member number received that way to the account, and delete it
            immediately when it is disconnected. When you log in from the app, we store a one-time
            record that hands the login to the app for up to 10 minutes. Purpose: logging in and
            signing up without a password.
          </Item>
        )}
        {GMAIL_AUTO_IMPORT_STARTS_ON && (
          <Item
            title={`Gmail auto import (optional, from ${englishDate(GMAIL_AUTO_IMPORT_STARTS_ON)})`}
          >
            If, after logging in, you allow the Google permissions (read mail, send to SubSlash, run
            every two weeks) under &lsquo;Connect Gmail&rsquo; or install the script in your own
            Google account yourself, the Apps Script sends the sender, subject, received time, and
            the beginning of the body of new payment emails to the SubSlash server every two weeks.
            The server stores only the subscription candidates found in these emails (service name,
            amount, currency, billing day, billing cycle, billing month, category, payment method,
            received date, sender); email subjects and bodies are not stored.
            {GMAIL_CHARGE_HISTORY_STARTS_ON &&
              ` From ${englishDate(GMAIL_CHARGE_HISTORY_STARTS_ON)}, the received date and amount of each earlier payment email from the same service are also stored with the candidate and used to fill subscription receipts for months before you registered it.`}{" "}
            The connection token is stored only as an irreversible hash, together with the last scan
            time and the number of emails received. When your logged-in browser opens, it receives
            the candidates and registers them as subscriptions or asks you to confirm. Purpose:
            finding and registering subscriptions from payment emails.
          </Item>
        )}
        {GMAIL_AUTO_IMPORT_STARTS_ON && (
          <Item
            title={`Adding billing days to Google Calendar (optional, from ${englishDate(GMAIL_AUTO_IMPORT_STARTS_ON)})`}
          >
            If, after logging in, you tap &lsquo;Add to Google Calendar&rsquo; yourself, the server
            briefly holds the name, amount, currency, billing day, billing cycle, billing month, and
            cancel address of your active subscriptions and the number of reminder days (the cancel
            address is written in the event note so you can go cancel straight from the calendar).
            This list is deleted as soon as the SubSlash Apps Script web app, running with your
            Google permission, picks it up (at the latest after 10 minutes). It is your Google
            permission, not SubSlash, that writes to the calendar, and SubSlash does not read your
            calendar. Purpose: adding billing days to your Google Calendar as recurring events.
          </Item>
        )}
        {ANONYMOUS_STATS_STARTS_ON && (
          <div id="anonymous-stats">
            <Item
              title={`Anonymous subscription statistics (optional, from ${englishDate(ANONYMOUS_STATS_STARTS_ON)})`}
            >
              Only devices that tapped &lsquo;Join anonymously&rsquo; in the report while logged in
              send to the server, while logged in, the monthly subscription spending total (in units
              of ₩1,000) and the number of subscriptions, plus, for each service on our service
              list, the service type, your share of the monthly amount (in units of ₩100), and the
              number of uses in your last check-in. Services whose name you typed yourself, notes,
              billing days, email, and account are not sent. Login is only checked when sending;
              records are not stored linked to your login account or IP. Logging out deletes that
              device&rsquo;s record. The device holds a token used to update and delete its record,
              and the server stores only an irreversible hash of that token. Comparisons are shown
              as median values only when there are enough participants (20 overall and 10 per
              service), so no single person&rsquo;s value is revealed. Purpose: comparing
              subscription spending and usage with other users.
              {STATS_AGE_BAND_STARTS_ON &&
                ` From ${englishDate(STATS_AGE_BAND_STARTS_ON)}, participating devices also send the age band they chose (teens, 20s, 30s, 40s, 50s, 60s and over; age itself is not collected), and once 10 or more people are in an age band we show the median monthly subscription spending for that band. You can participate without choosing an age band.`}
            </Item>
          </div>
        )}
        {DEVICE_USAGE_STARTS_ON && (
          <div id="device-usage">
            <Item
              title={`Multi-device usage measurement (optional, when logged in, from ${englishDate(DEVICE_USAGE_STARTS_ON)})`}
            >
              Only on devices where you tap &lsquo;Turn on usage measurement&rsquo; in the Android
              app and allow &lsquo;Usage access&rsquo; in the device settings yourself, we store in
              your logged-in account the start and end times when the app of a service on our
              service list (Netflix, Spotify, etc.) was in the foreground, together with the service
              type. For each device we also store a device number, the measured period, and a device
              name you gave it. The device number is an irreversible value made by mixing the device
              identifier Android gives the SubSlash app with your account; the identifier itself is
              not sent to the server and cannot be linked to another account&rsquo;s devices. Even
              if you uninstall and reinstall the app, it continues as the same device, so one phone
              is not stored as two devices. We do not store apps not on the list, content viewed
              inside apps, playback speed, location, device model, or advertising ID. Records from
              multiple devices on the same account are joined so that watching on your phone and
              continuing on your tablet within 30 minutes counts as one use. Purpose: calculating
              uses per subscription and the cost per use.
            </Item>
          </div>
        )}
        <Item title="Sign-up and login (optional)">
          We store your username, email, password (only as an irreversible hash; the original is not
          stored), email confirmation time, and sign-up and last login times. Age and gender are
          optional and stored only if you enter them at sign-up or under &lsquo;My account&rsquo;;
          you can sign up and use every feature without them. They are not currently used in any
          calculation or statistic. Whether you are 14 or older, asked at sign-up, is used only for
          confirmation and not stored. Purpose: identifying you, keeping you logged in, and sending
          sign-up confirmation and password reset emails.
        </Item>
        <Item title="Account sync (when logged in)">
          When you log in, we save one copy of this device&rsquo;s subscription, check-in, and
          exchange rate records (including the sign-up account you note for each subscription) to
          your account, and save it again whenever the records change, to keep them in step with
          your other logged-in devices (web and app). You can turn this off on each device with
          &lsquo;Turn off auto sync&rsquo;; a device with it off saves only when you tap &lsquo;Save
          to account&rsquo;. Purpose: using the same records across devices.
        </Item>
        <Item title="Billing reminder emails and calendar feed addresses (discontinued)">
          Discontinued on {effective}. We no longer collect them, and the email addresses, reminder
          settings, subscriptions copied to the server, and sending records stored until then are
          all deleted by a cleanup job that runs once a day. You can get billing reminders through
          the app&rsquo;s &lsquo;Billing reminders on this device&rsquo; (which do not go through a
          server) or &lsquo;Add billing days to Google Calendar&rsquo;.
        </Item>
        <Item title="Account email sending records">
          We keep the address and time of sign-up confirmation and password reset emails we send.
          Purpose: limiting emails to one address (5 per 24 hours) so they don&rsquo;t pile up in
          someone else&rsquo;s inbox.
        </Item>
        <Item title="Access logs">
          Vercel, which hosts the service, processes requests and may keep access logs such as IP
          address and request time and path for a period of time. SubSlash does not use analytics
          tools or advertising cookies.
        </Item>
      </Section>

      <Section title="2. Retention and deletion">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Account information: deleting your account immediately deletes the account, login
            sessions, and records saved to the account.
          </li>
          <li>
            Login sessions: deleted when you log out; they expire 30 days after login, and expired
            sessions are deleted automatically once a day.
          </li>
          <li>
            Accounts whose email was never confirmed: deleted automatically if there has been no
            login for 90 days after sign-up and no records are saved to the account.
          </li>
          <li>
            Records saved to your account: only the latest copy is kept. Saving again through auto
            sync or &lsquo;Save to account&rsquo; overwrites the previous one, and it is deleted
            with &lsquo;Delete from account&rsquo; or account deletion.
          </li>
          <li>
            Billing reminder emails (discontinued): remaining reminder information and the
            subscriptions and sending records copied to the server are deleted automatically by a
            cleanup job that runs once a day.
          </li>
          {GMAIL_AUTO_IMPORT_STARTS_ON && (
            <li>
              Gmail auto import: subscription candidates are deleted as soon as your browser
              receives them, and candidates not received are deleted after 30 days. The connection
              token is deleted, along with remaining candidates, when you &lsquo;Disconnect&rsquo;
              or delete your account. With &lsquo;Connect Gmail&rsquo;, the connection token and
              scan time kept at Google are deleted by the script itself at the next scan after you
              disconnect (at most two weeks), and scanning stops.
            </li>
          )}
          {GMAIL_AUTO_IMPORT_STARTS_ON && (
            <li>
              Adding billing days to Google Calendar: the subscription list we hold is deleted as
              soon as the web app picks it up; if it isn&rsquo;t picked up, it becomes unusable
              after 10 minutes and is deleted at the next registration. Events already in the
              calendar are removed only by deleting the &lsquo;SubSlash 결제일&rsquo; (SubSlash
              billing days) calendar in Google Calendar.
            </li>
          )}
          {DEVICE_USAGE_STARTS_ON && (
            <li>
              Multi-device usage measurement: records older than 40 days are deleted automatically.
              Turning off measurement on a device immediately deletes that device&rsquo;s records,
              and deleting your account immediately deletes the records of all devices.
            </li>
          )}
          {ANONYMOUS_STATS_STARTS_ON && (
            <li>
              Anonymous subscription statistics: deleted immediately when you tap &lsquo;Stop&rsquo;
              in the report, and records not updated for 180 days are deleted automatically.
            </li>
          )}
          {SOCIAL_LOGIN_STARTS_ON && (
            <li>
              Login with Google, Kakao, or Naver: the member number hash is deleted immediately with
              the account when you delete your account. The one-time record handed to the app is
              deleted as soon as the app receives it; if not received, it becomes unusable after 10
              minutes and is deleted at the next login.
            </li>
          )}
          <li>
            Account email sending records: records older than 24 hours are deleted when the next
            email is sent to the same address.
          </li>
          <li>
            Records in your browser: our server cannot delete them. Delete them with &lsquo;Reset
            everything&rsquo; in My subscriptions or by clearing the site data in your browser.
          </li>
        </ul>
      </Section>

      <Section title="3. Provision to third parties">
        <p>We do not provide personal information to other people or companies.</p>
      </Section>

      <Section title="4. Processors and international transfer">
        <p>
          To run the service, we use the services of the companies below. Information that goes to
          our server is transmitted over the network at the moment you use it and is processed and
          stored outside Korea. If you don&rsquo;t log in or save to your account, no personal
          information goes to the server.
        </p>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Recipient</th>
                <th className="px-3 py-2 text-left font-medium">What it does</th>
                <th className="px-3 py-2 text-left font-medium">Processing and storage location</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-3 py-2 font-medium">Vercel</td>
                <td className="px-3 py-2">Web hosting, running the server</td>
                <td className="px-3 py-2">United States (server region: US East)</td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-2 font-medium">Turso</td>
                <td className="px-3 py-2">Database (the server-stored items in section 1)</td>
                <td className="px-3 py-2">Tokyo, Japan (AWS)</td>
              </tr>
              {GMAIL_AUTO_IMPORT_STARTS_ON && (
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium">Google</td>
                  <td className="px-3 py-2">
                    If you use &lsquo;Connect Gmail&rsquo;, runs the SubSlash Apps Script with your
                    permission to read payment emails and send them to SubSlash — keeps the
                    connection token and last scan time. If you use &lsquo;Add to Google
                    Calendar&rsquo;, receives subscription names, amounts, and billing days the same
                    way and writes them as events to your calendar
                  </td>
                  <td className="px-3 py-2">Outside Korea (Google data centers)</td>
                </tr>
              )}
              {storageQuotaWebAppUrl() && (
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium">Google</td>
                  <td className="px-3 py-2">
                    If you use &lsquo;Measure usage&rsquo; in the Google One check-in, runs the
                    SubSlash Apps Script with your permission to read your account storage (limit
                    and usage) and returns it only to your browser or app to fill the check-in field
                    — not sent to or kept on the SubSlash server
                  </td>
                  <td className="px-3 py-2">Outside Korea (Google data centers)</td>
                </tr>
              )}
              {SOCIAL_LOGIN_STARTS_ON && (
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium">Google, Kakao, Naver</td>
                  <td className="px-3 py-2">
                    If you choose to log in with that company, it verifies you and tells SubSlash
                    your email and member number (SubSlash sends it no personal information)
                  </td>
                  <td className="px-3 py-2">
                    Each company&rsquo;s processing location (Google: outside Korea)
                  </td>
                </tr>
              )}
              <tr className="border-t">
                <td className="px-3 py-2 font-medium">Resend</td>
                <td className="px-3 py-2">
                  Sending email — delivers the recipient address and content
                </td>
                <td className="px-3 py-2">United States</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="space-y-2 rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold">If you don&rsquo;t want international transfer</h3>
          <p className="text-muted-foreground">
            You can refuse international transfer. Because the SubSlash server runs only on the
            overseas services in the table above, the way to refuse is not to use features that send
            information to the server. If you use SubSlash without signing up, your subscription
            records never leave this device, and you can still register subscriptions, check in, see
            the cost per use, use the cancel guide, and download backup files. If you already use
            them, you can delete what was sent and stop with &lsquo;Delete account&rsquo; or
            &lsquo;Delete from account&rsquo; under My account, or &lsquo;Disconnect&rsquo; in the
            Gmail connection. If you refuse, however, you cannot use login, saving to your account,
            multi-device sync
            {GMAIL_AUTO_IMPORT_STARTS_ON &&
              ", Gmail auto import, adding billing days to Google Calendar"}
            {ANONYMOUS_STATS_STARTS_ON && ", joining anonymous subscription statistics"}
            {DEVICE_USAGE_STARTS_ON && ", multi-device usage measurement"}
            {SOCIAL_LOGIN_STARTS_ON && ", or logging in with Google, Kakao, or Naver"}.
          </p>
        </div>
      </Section>

      <Section title="5. Handling of Google user data (Limited Use)">
        <p className="text-muted-foreground">
          SubSlash&rsquo;s use and transfer to any other app of information received from Google
          APIs will adhere to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Content received through the mail read permission (<code>gmail.readonly</code>) is used
            only for the feature that finds and registers subscriptions from payment emails, and for
            no other purpose.
          </li>
          <li>
            It is not used for advertising. It is not used or transferred for personalized or
            interest-based advertising or retargeting, and SubSlash has no ads.
          </li>
          <li>
            Humans do not read it. Emails are parsed automatically by the server on the spot, and
            subjects and bodies are not stored (all that remains are subscription candidates such as
            service name, amount, and billing day). Exceptions are when required by law, when needed
            to investigate a security issue, or when you give explicit consent.
          </li>
          <li>
            It is not sold or transferred to third parties, and not provided to advertising
            platforms or data brokers.
          </li>
          <li>It is not used to train artificial intelligence models.</li>
        </ul>
      </Section>

      <Section title="6. Your rights and how to exercise them">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Access and correction: under{" "}
            <Link href="/me" className="underline underline-offset-4">
              My account
            </Link>{" "}
            you can see your account information and correct or delete your age and gender.
          </li>
          <li>
            Deletion: you can delete it yourself with &lsquo;Delete account&rsquo; and &lsquo;Delete
            from account&rsquo; under My account.
            {SOCIAL_LOGIN_STARTS_ON &&
              " Accounts signed up with Google, Kakao, or Naver that have no password are deleted by typing '탈퇴' (the confirmation word) instead of a password. Disconnecting SubSlash in that company's account settings alone does not delete your SubSlash account and records; to delete them, please delete your account."}
          </li>
          <li>
            Suspension of processing: processing on the server stops as soon as you turn off that
            feature — &lsquo;Turn off auto sync&rsquo; (per device) under My account and
            &lsquo;Disconnect&rsquo; in the Gmail connection. For other requests to stop processing,
            contact the privacy officer below. If we cannot stop for a reason set by law, we will
            tell you why.
          </li>
          <li>For other requests, contact the privacy officer below.</li>
        </ul>
      </Section>

      <Section title="7. Children under 14">
        <p>We confirm at sign-up that you are 14 or older; children under 14 cannot sign up.</p>
      </Section>

      <Section title="8. Cookies and browser storage">
        <p>
          We use one session cookie (<code>subslash_session</code>, not readable by JavaScript, 30
          days) to keep you logged in.
          {SOCIAL_LOGIN_STARTS_ON &&
            " While you log in with Google, Kakao, or Naver, we use one more cookie (subslash_oauth, not readable by JavaScript, up to 10 minutes) to check that the login request started in this browser, and delete it when login finishes. This cookie contains no personal information."}{" "}
          Settings such as subscription records, theme, and view mode are kept in browser storage
          (localStorage) and not sent to the server. If you block cookies in your browser settings,
          you cannot log in, but every other feature still works.
        </p>
      </Section>

      <Section title="9. Security measures">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Passwords are stored hashed with scrypt; the originals are not stored.</li>
          <li>
            Only SHA-256 hashes of login sessions and connection tokens are stored on the server.
            Even if the database leaked, those values could not be used to log in or change records.
          </li>
          {SOCIAL_LOGIN_STARTS_ON && (
            <li>
              Google, Kakao, and Naver member numbers are stored only as SHA-256 hashes mixed with
              the company name, and the access tokens those companies give are not stored.
            </li>
          )}
          <li>All communication is encrypted with HTTPS.</li>
        </ul>
      </Section>

      <Section title="10. Privacy officer">
        {PRIVACY_OFFICER ? (
          <p>
            {PRIVACY_OFFICER.name} ·{" "}
            <a href={`mailto:${PRIVACY_OFFICER.email}`} className="underline underline-offset-4">
              {PRIVACY_OFFICER.email}
            </a>
          </p>
        ) : (
          <p className="rounded-xl border border-dashed p-3 text-muted-foreground">
            We have not yet designated a privacy officer and contact. We will post them here once
            they are set.
          </p>
        )}
      </Section>

      <Section title="11. Remedies for infringement of rights">
        <p>
          If your personal information has been infringed and you need help, you can apply for
          dispute resolution or counseling at the agencies below (Korean public agencies). You may
          also first tell the privacy officer above about any objection to SubSlash&rsquo;s
          processing.
        </p>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Agency</th>
                <th className="px-3 py-2 text-left font-medium">What it does</th>
                <th className="px-3 py-2 text-left font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {REMEDY_BODIES.map((body) => (
                <tr key={body.name} className="border-t">
                  <td className="px-3 py-2 font-medium">{body.nameEn}</td>
                  <td className="px-3 py-2">{body.roleEn}</td>
                  <td className="px-3 py-2">
                    (no area code, in Korea) {body.phone}
                    <br />
                    <a
                      href={body.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      {body.url.replace(/^https?:\/\//, "")}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground">
          If a request under Articles 35 (access), 36 (correction and deletion), or 37 (suspension
          of processing) of the Personal Information Protection Act is refused, you may also file an
          administrative appeal under the Administrative Appeals Act.
        </p>
      </Section>

      <Section title="12. Changes to this policy">
        <p>
          If we change this policy, we will post the new content and effective date on this page.
          Changes that add stored items will be announced before they take effect.
        </p>
      </Section>
    </article>
  );
}
