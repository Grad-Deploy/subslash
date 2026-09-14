import { useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

/**
 * iPad에서 SubSlash 웹 화면을 iPhone 크기 그대로 보는 미리보기.
 *
 * 앱(Capacitor iOS)은 웹 화면을 WKWebView로 그린다. 여기서도 같은 WKWebView(react-native-webview)로
 * 그리되, iPad 화면 가운데에 iPhone 크기의 틀을 두고 그 안에만 그린다. 웹은 틀의 폭을 기기 폭으로
 * 알아서 iPhone과 같은 배치가 나온다.
 *
 * 상태 표시줄·홈 표시줄 자리는 틀 안에서 그만큼 비워 둔다. 실제 iPhone에서는 웹이 그 자리까지
 * 그리고 safe-area 여백으로 비켜 가는데, 틀 안의 WebView에는 safe-area 값이 없어서(0) 여기서
 * 대신 비운다. 빈 자리는 페이지 배경색으로 칠한다.
 */

const TARGETS = [
  { label: "운영", url: "https://subslash-web-qki1.vercel.app" },
  { label: "미러", url: "https://subslash-web.vercel.app" },
] as const;

/** iPhone 화면 크기와 세로 방향 안전 영역(pt). */
const DEVICES = [
  { label: "iPhone 15", width: 393, height: 852, top: 59, bottom: 34 },
  { label: "iPhone SE", width: 375, height: 667, top: 20, bottom: 0 },
  { label: "iPhone 15 Pro Max", width: 430, height: 932, top: 59, bottom: 34 },
] as const;

type Device = (typeof DEVICES)[number];

/** 페이지 배경색을 알려준다. 테마를 바꾸면(<html>의 class) 다시 알린다. */
const REPORT_BACKGROUND = `
(function () {
  function post() {
    var bg = getComputedStyle(document.body).backgroundColor;
    window.ReactNativeWebView.postMessage(JSON.stringify({ bg: bg }));
  }
  new MutationObserver(post).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  post();
})();
true;
`;

/** 위쪽 도구 줄의 대략 높이. 틀이 화면에 다 들어오는지 계산할 때 뺀다. */
const TOOLBAR_HEIGHT = 128;
const STAGE_PADDING = 16;

export default function App() {
  return (
    <SafeAreaProvider>
      <Preview />
    </SafeAreaProvider>
  );
}

function Preview() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const webView = useRef<WebView>(null);
  const [url, setUrl] = useState<string>(TARGETS[0].url);
  const [draft, setDraft] = useState("");
  const [device, setDevice] = useState<Device>(DEVICES[0]);
  const [pageBackground, setPageBackground] = useState("#ffffff");

  // iPad를 눕히면 틀이 화면에 다 들어오게 비율 그대로 줄인다. 키우지는 않는다(1pt는 1pt).
  const scale = Math.min(
    1,
    (windowWidth - STAGE_PADDING * 2) / device.width,
    (windowHeight - TOOLBAR_HEIGHT - STAGE_PADDING * 2) / device.height,
  );

  const openDraft = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setUrl(/^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`);
  };

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { bg?: string };
      if (data.bg) setPageBackground(data.bg);
    } catch {
      // 페이지가 보낸 다른 메시지는 무시한다.
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      <View style={styles.toolbar}>
        <View style={styles.row}>
          {TARGETS.map((target) => (
            <Chip
              key={target.url}
              label={target.label}
              active={url === target.url}
              onPress={() => setUrl(target.url)}
            />
          ))}
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={openDraft}
            placeholder="다른 주소 (예: PR 미리보기 배포)"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            style={styles.input}
          />
          <Chip label="열기" onPress={openDraft} />
        </View>

        <View style={styles.row}>
          {DEVICES.map((candidate) => (
            <Chip
              key={candidate.label}
              label={candidate.label}
              active={device.label === candidate.label}
              onPress={() => setDevice(candidate)}
            />
          ))}
          <View style={styles.spacer} />
          <Chip label="← 뒤로" onPress={() => webView.current?.goBack()} />
          <Chip label="새로고침" onPress={() => webView.current?.reload()} />
        </View>

        <Text style={styles.caption} numberOfLines={1}>
          {device.label} · {device.width}×{device.height}pt · {Math.round(scale * 100)}% · {url}
        </Text>
      </View>

      <View style={styles.stage}>
        {/* 줄인 크기만큼 자리를 잡고, 그 안에서 원래 크기의 틀을 가운데 기준으로 줄인다. */}
        <View style={{ width: device.width * scale, height: device.height * scale }}>
          <View
            style={[
              styles.phone,
              {
                width: device.width,
                height: device.height,
                left: (device.width * scale - device.width) / 2,
                top: (device.height * scale - device.height) / 2,
                backgroundColor: pageBackground,
                transform: [{ scale }],
              },
            ]}
          >
            <View style={{ height: device.top }} />
            <WebView
              ref={webView}
              source={{ uri: url }}
              style={styles.web}
              injectedJavaScript={REPORT_BACKGROUND}
              onMessage={onMessage}
              allowsBackForwardNavigationGestures
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
              setSupportMultipleWindows={false}
            />
            <View style={{ height: device.bottom }} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Chip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#e4e4e7" },
  toolbar: { height: TOOLBAR_HEIGHT, paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  spacer: { flex: 1 },
  input: {
    flex: 1,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    fontSize: 14,
  },
  caption: { fontSize: 12, color: "#52525b" },
  chip: {
    paddingHorizontal: 12,
    height: 36,
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#ffffff",
  },
  chipActive: { backgroundColor: "#18181b" },
  chipText: { fontSize: 14, color: "#18181b", fontWeight: "600" },
  chipTextActive: { color: "#fafafa" },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", padding: STAGE_PADDING },
  phone: {
    position: "absolute",
    overflow: "hidden",
    borderRadius: 44,
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  web: { flex: 1, backgroundColor: "transparent" },
});
