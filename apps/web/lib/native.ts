/**
 * 앱(Capacitor)에서 네이티브 기능으로 바꾸는 동작. 웹에서는 브라우저 기능 그대로다.
 *
 * 플러그인은 IS_APP_BUILD 분기 안에서 동적으로 불러온다. 동적 import는 따로 떨어진 청크가 되어
 * 첫 화면 스크립트에 들어가지 않고, 웹에서는 이 분기를 타지 않으므로 그 청크를 받지 않는다.
 */
import { IS_APP_BUILD } from "./platform";

/**
 * 밖으로 열어도 되는 주소인지. http(s)만 연다.
 *
 * 해지 주소는 사용자가 적거나 백업 파일·계정 기록에서 들어오고, 백업은 문자열이면 받는다. 누가 만든
 * 백업을 불러오면 '해지하러 가기'에 `javascript:`(웹에서 이 사이트의 권한으로 실행)나 `intent:`(앱에서
 * 다른 앱을 실행) 주소가 들어갈 수 있다. 들어오는 곳이 여럿이라 여는 곳에서 막는다.
 */
export function isSafeExternalUrl(url: string | undefined | null): url is string {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * 외부 사이트(해지 페이지 등)를 연다. 앱에서는 인앱 브라우저(안드로이드 Custom Tabs, iOS
 * SFSafariViewController)로 열어, 해지를 마치고 닫으면 곧바로 앱으로 돌아온다.
 */
export function openExternal(url: string | undefined): void {
  if (!isSafeExternalUrl(url)) {
    if (url) console.warn("[native] http(s)가 아닌 주소는 열지 않습니다");
    return;
  }
  if (IS_APP_BUILD) {
    void import("@capacitor/browser")
      .then(({ Browser }) => Browser.open({ url }))
      .catch((error) => console.error("[native] 링크를 열지 못했습니다", error));
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * 사용자를 외부 사이트로 보냈다가 돌아오게 한다(Google 권한 화면처럼, 그 사이트에서 무언가를 마치고
 * 와야 하는 흐름).
 *
 * 웹에서는 이 탭이 그대로 그 주소로 간다 — 돌아오면 화면이 처음부터 다시 그려져 바뀐 상태가 보인다.
 * 앱에서는 그럴 수 없다. 웹뷰가 통째로 외부 사이트로 가면 그 안에 담긴 앱 화면을 잃고, 외부
 * 사이트의 '돌아가기'는 앱이 아니라 웹사이트를 연다. 그래서 인앱 브라우저로 열고, 닫으면 앱으로
 * 돌아온 뒤 `onReturn`으로 화면을 다시 맞춘다.
 */
export function leaveForExternal(url: string, onReturn?: () => void): void {
  if (!isSafeExternalUrl(url)) return;
  if (IS_APP_BUILD) {
    void import("@capacitor/browser")
      .then(async ({ Browser }) => {
        const finished = await Browser.addListener("browserFinished", () => {
          void finished.remove();
          onReturn?.();
        });
        await Browser.open({ url });
      })
      .catch((error) => {
        console.error("[native] 링크를 열지 못했습니다", error);
        onReturn?.();
      });
    return;
  }
  window.location.assign(url);
}

export interface SharePayload {
  title: string;
  /** 링크까지 담은 문장. */
  text: string;
  url: string;
}

/**
 * 공유 창을 연다. 공유했거나 사용자가 창을 닫았으면 true, 공유할 수 없으면 false — 그때 부른
 * 쪽이 복사로 넘어간다.
 *
 * 앱에서는 네이티브 공유 창을 쓴다. 안드로이드 플러그인은 text와 url을 함께 받으면 이어 붙이는데,
 * 우리 문장에는 이미 링크가 들어 있어 링크가 두 번 찍히지 않게 text만 넘긴다.
 */
export async function shareText({ title, text, url }: SharePayload): Promise<boolean> {
  if (IS_APP_BUILD) {
    const { Share } = await import("@capacitor/share");
    try {
      await Share.share({ title, text, dialogTitle: title });
      return true;
    } catch (error) {
      return /cancel/i.test(String((error as Error)?.message));
    }
  }
  if (!navigator.share) return false;
  try {
    await navigator.share({ title, text, url });
    return true;
  } catch (error) {
    // 공유 창을 닫은 것이면 그대로 둔다. 공유를 못 하는 환경이면 복사로 넘어간다.
    return (error as DOMException)?.name === "AbortError";
  }
}

/**
 * 글자를 클립보드에 복사한다. 복사했으면 true, 못 했으면 false — 못 했을 때 '복사됨'을 띄우지 않고
 * 글자를 화면에 보여주는 것은 부른 쪽이 한다.
 *
 * 앱에서는 네이티브 클립보드를 쓴다. 웹뷰의 `navigator.clipboard`는 출처(`capacitor://`)나 웹뷰
 * 버전에 따라 없거나 거절되어, 앱에서만 복사 버튼이 아무것도 하지 않았다.
 */
export async function copyText(text: string): Promise<boolean> {
  if (IS_APP_BUILD) {
    try {
      const { Clipboard } = await import("@capacitor/clipboard");
      await Clipboard.write({ string: text });
      return true;
    } catch (error) {
      console.error("[native] 복사하지 못했습니다", error);
      return false;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * 파일을 사용자에게 넘긴다(백업 파일 등). 넘겼으면 true, 사용자가 공유 창을 닫았으면 false.
 *
 * 웹에서는 브라우저가 내려받는다. 앱의 웹뷰는 내려받기를 처리하지 않아 `<a download>`가 아무
 * 일도 하지 않는다 — 그래서 앱은 파일을 기기의 임시 폴더에 쓰고 네이티브 공유 창을 연다. 사용자가
 * 그 창에서 저장할 곳(파일 앱·드라이브·메일 등)을 고른다.
 */
export async function saveFile(name: string, content: string, mimeType: string): Promise<boolean> {
  if (IS_APP_BUILD) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import("@capacitor/filesystem"),
      import("@capacitor/share"),
    ]);
    const { uri } = await Filesystem.writeFile({
      path: name,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    try {
      await Share.share({ title: name, files: [uri], dialogTitle: name });
      return true;
    } catch (error) {
      if (/cancel/i.test(String((error as Error)?.message))) return false;
      throw error;
    }
  }
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}

/** 막대 뒤 창 배경색. layout의 themeColor와 같은 값이다. */
const WINDOW_COLORS = { light: "#ffffff", dark: "#09090b" } as const;

interface AppWindowPlugin {
  setBackgroundColor(options: { color: string }): Promise<void>;
}

let appWindow: AppWindowPlugin | null = null;

/**
 * 상태 표시줄·내비게이션 바를 앱 테마에 맞춘다. 웹에서는 아무것도 하지 않는다.
 *
 * 아이콘 색은 Capacitor에 들어 있는 SystemBars로 바꾼다. 막대 뒤 색은 **안드로이드에서만**
 * 네이티브 AppWindow(apps/mobile의 AppWindowPlugin)로 바꾼다 — 웹뷰가 오래됐으면(Chromium 140
 * 미만) Capacitor가 웹뷰를 막대 안쪽으로 줄여, 막대 뒤에는 페이지가 아니라 창 배경이 보이기
 * 때문이다. 새 웹뷰에서는 페이지(헤더의 pt-safe)가 막대 뒤까지 칠하고, 창 배경은 가려진다.
 *
 * iOS에는 그 플러그인이 없다. 부르면 "not implemented on ios"로 거절당해, 테마를 바꿀 때마다
 * 경고만 쌓인다. iOS의 WKWebView는 늘 막대 밑까지 그려서 창 배경이 보이지도 않으므로 건너뛴다.
 */
export function syncSystemBars(theme: "light" | "dark"): void {
  if (!IS_APP_BUILD) return;
  void import("@capacitor/core")
    .then(async ({ Capacitor, SystemBars, SystemBarsStyle, registerPlugin }) => {
      const tasks: Promise<unknown>[] = [
        // Dark는 "어두운 배경 위의 밝은 아이콘"이다.
        SystemBars.setStyle({
          style: theme === "dark" ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
        }),
      ];
      if (Capacitor.getPlatform() === "android") {
        appWindow ??= registerPlugin<AppWindowPlugin>("AppWindow");
        tasks.push(appWindow.setBackgroundColor({ color: WINDOW_COLORS[theme] }));
      }
      await Promise.all(tasks);
    })
    .catch((error) => console.warn("[native] 시스템 막대 색을 맞추지 못했습니다", error));
}
