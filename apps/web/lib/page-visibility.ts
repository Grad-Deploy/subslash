/**
 * 화면으로 돌아왔을 때(탭이 다시 보이거나 앱이 앞으로 왔을 때) `onVisible`을 부른다. 다른 앱·설정·인앱 브라우저에
 * 다녀오는 동안 바뀐 것(권한, 로그인, 다른 기기의 기록)을 다시 읽는 곳들이 쓴다. 화면이 가려질 때는 부르지 않는다.
 *
 * `resume`을 켜면 Capacitor가 앱 복귀 때 document에 보내는 'resume'도 듣는다(같은 복귀에 두 번 불릴 수 있다).
 * 멈추는 함수를 돌려준다.
 */
export function onPageVisible(onVisible: () => void, options?: { resume?: boolean }): () => void {
  const onChange = () => {
    if (document.visibilityState === "visible") onVisible();
  };
  document.addEventListener("visibilitychange", onChange);
  if (options?.resume) document.addEventListener("resume", onChange);
  return () => {
    document.removeEventListener("visibilitychange", onChange);
    if (options?.resume) document.removeEventListener("resume", onChange);
  };
}
