package com.subslash.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 창 배경색을 화면 테마에 맞춘다(apps/web/lib/native의 syncSystemBars가 부른다).
 *
 * 웹뷰가 오래됐으면(Chromium 140 미만) Capacitor가 웹뷰를 상태 표시줄·내비게이션 바 안쪽으로
 * 줄여서, 막대 뒤에는 페이지가 아니라 창 배경이 보인다. 앱 안에서 테마를 바꾸면 이 색도 따라가야
 * 막대만 다른 색으로 남지 않는다.
 *
 * 외부 주소를 서비스 앱으로 여는 일(openInApp)도 여기서 한다.
 */
@CapacitorPlugin(name = "AppWindow")
public class AppWindowPlugin extends Plugin {

    @PluginMethod
    public void setBackgroundColor(PluginCall call) {
        String value = call.getString("color");
        int color;
        try {
            color = Color.parseColor(value);
        } catch (IllegalArgumentException | NullPointerException e) {
            call.reject("color는 #RRGGBB 형식이어야 합니다: " + value);
            return;
        }
        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().getDecorView().setBackgroundColor(color);
            call.resolve();
        });
    }

    /**
     * 주소를 맡겠다고 한 앱(브라우저 제외)이 설치돼 있으면 그 앱으로 연다(apps/web/lib/native의
     * openExternal이 부른다). 열었으면 { opened: true }, 맡을 앱이 없으면 false — 그때 화면은 인앱
     * 브라우저로 연다.
     *
     * 앱은 자기가 처리하는 경로만 매니페스트에 적으므로, 그 앱이 해지 주소를 맡겠다고 할 때에만 열린다.
     * 해지 화면 주소로 앱의 첫 화면만 여는 일은 없다. 브라우저를 빼는 플래그는 안드로이드 11(API 30)부터
     * 있어서, 그보다 오래된 기기는 늘 인앱 브라우저로 연다 — 브라우저를 빼지 못하면 기본 브라우저가
     * 열려 앱 밖으로 나간다.
     */
    @PluginMethod
    public void openInApp(PluginCall call) {
        String url = call.getString("url");
        JSObject result = new JSObject();
        if (url == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            result.put("opened", false);
            call.resolve(result);
            return;
        }
        Uri uri = Uri.parse(url);
        String scheme = uri.getScheme();
        if (!"https".equals(scheme) && !"http".equals(scheme)) {
            call.reject("http(s) 주소만 엽니다");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        intent.addCategory(Intent.CATEGORY_BROWSABLE);
        intent.addFlags(Intent.FLAG_ACTIVITY_REQUIRE_NON_BROWSER);
        try {
            getActivity().startActivity(intent);
            result.put("opened", true);
        } catch (ActivityNotFoundException e) {
            result.put("opened", false);
        }
        call.resolve(result);
    }
}
