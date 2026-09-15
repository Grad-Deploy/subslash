package com.subslash.app;

import android.graphics.Color;
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
}
