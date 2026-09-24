/**
 * 웹 빌드에서 "virtual:app-launch-flow"가 연결되는 자리(next.config.ts의
 * turbopack.resolveAlias). 진짜 구현(AppLaunchFlow)의 문구·애니메이션 코드가 웹 번들에
 * 들어가지 않도록, 상대 경로 import 대신 이 가상 지정자를 빌드 대상에 따라 다른 파일로 바꿔
 * 끼운다.
 */
export default function AppLaunchFlowStub(_props: { onReady: () => void }) {
  return null;
}
