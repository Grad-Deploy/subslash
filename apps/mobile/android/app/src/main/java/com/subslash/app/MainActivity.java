package com.subslash.app;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;
import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 앱 안에 둔 플러그인은 브리지가 만들어지기 전(super.onCreate 전)에 등록해야 화면에서 부를 수 있다.
        registerPlugin(AppWindowPlugin.class);
        registerPlugin(UsageStatsPlugin.class);
        registerPlugin(KakaoLoginPlugin.class);
        SplashScreen.installSplashScreen(this);
        // 안드로이드 15(SDK 35)부터는 앱이 상태 표시줄·내비게이션 바 뒤까지 그린다. 14 이하에서도 같게 그려
        // 기기마다 화면이 달라지지 않게 한다. 막대 높이(인셋)는 Capacitor의 SystemBars가 웹뷰에 넘기고
        // (safe-area), 막대 아이콘 색은 웹의 syncSystemBars가 테마에 맞춘다. 화면을 그리기 전에 불러야 한다.
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
