package com.subslash.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.kakao.sdk.auth.model.OAuthToken;
import com.kakao.sdk.common.KakaoSdk;
import com.kakao.sdk.common.model.ClientError;
import com.kakao.sdk.common.model.ClientErrorCause;
import com.kakao.sdk.user.UserApiClient;

import kotlin.Unit;
import kotlin.jvm.functions.Function2;

/**
 * 카카오톡 앱으로 로그인한다(apps/web/lib/kakao-native가 부른다).
 *
 * 예전에는 앱도 웹처럼 인앱 브라우저에서 카카오 로그인 화면을 거쳤다. 이제 카카오톡이 있으면 카카오톡이
 * 열려 확인만 누르고 앱으로 돌아온다. 카카오톡이 없거나 카카오톡 로그인이 안 되면 SDK가 카카오계정 로그인을
 * 인앱 브라우저로 열고 AuthCodeHandlerActivity로 돌아온다 — 어느 쪽이든 웹사이트를 거치지 않는다.
 *
 * 여기서는 액세스 토큰만 받아 화면에 넘긴다. 계정을 찾거나 만드는 것은 서버(/api/auth/oauth/native)가
 * 토큰이 이 앱에서 발급됐는지 확인한 뒤 웹 로그인과 같은 규칙으로 한다. 토큰은 저장하지 않는다.
 */
@CapacitorPlugin(name = "KakaoLogin")
public class KakaoLoginPlugin extends Plugin {

    private boolean ready = false;

    @Override
    public void load() {
        String key = BuildConfig.KAKAO_NATIVE_APP_KEY;
        if (key == null || key.isEmpty()) return;
        KakaoSdk.init(getContext(), key);
        ready = true;
    }

    /** 이 빌드에 카카오 키가 있어 쓸 수 있는지. 없으면 화면은 인앱 브라우저로 로그인한다. */
    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", ready);
        call.resolve(result);
    }

    /**
     * 로그인하고 { accessToken }을 돌려준다. 사용자가 취소하면 "cancelled"로 거절한다 — 화면은 아무 말도
     * 하지 않는다. 그 밖의 실패는 "failed"다.
     */
    @PluginMethod
    public void login(PluginCall call) {
        if (!ready) {
            call.reject("카카오 로그인을 쓸 수 없는 빌드입니다.", "unavailable");
            return;
        }
        UserApiClient client = UserApiClient.getInstance();
        Function2<OAuthToken, Throwable, Unit> finish = (token, error) -> {
            settle(call, token, error);
            return Unit.INSTANCE;
        };
        getActivity().runOnUiThread(() -> {
            if (!client.isKakaoTalkLoginAvailable(getContext())) {
                client.loginWithKakaoAccount(getContext(), finish);
                return;
            }
            client.loginWithKakaoTalk(getContext(), (token, error) -> {
                if (error != null && !isCancelled(error)) {
                    // 카카오톡에 연결된 계정이 없는 등 카카오톡 로그인이 안 되면 카카오계정으로 다시 묻는다.
                    // 카카오톡에서 취소한 것은 그대로 끝낸다(사용자가 그만둔 것이다).
                    client.loginWithKakaoAccount(getContext(), finish);
                } else {
                    settle(call, token, error);
                }
                return Unit.INSTANCE;
            });
        });
    }

    private static boolean isCancelled(Throwable error) {
        return error instanceof ClientError
            && ((ClientError) error).getReason() == ClientErrorCause.Cancelled;
    }

    private static void settle(PluginCall call, OAuthToken token, Throwable error) {
        if (error != null) {
            if (isCancelled(error)) call.reject("로그인을 취소했어요.", "cancelled");
            else call.reject("카카오 로그인에 실패했어요.", "failed");
            return;
        }
        if (token == null) {
            call.reject("카카오 로그인에 실패했어요.", "failed");
            return;
        }
        JSObject result = new JSObject();
        result.put("accessToken", token.getAccessToken());
        call.resolve(result);
    }
}
