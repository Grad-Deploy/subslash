package com.subslash.app;

import android.os.Bundle;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 앱 안에 둔 플러그인은 브리지가 만들어지기 전(super.onCreate 전)에 등록해야 화면에서 부를 수 있다.
        registerPlugin(AppWindowPlugin.class);
        registerPlugin(UsageStatsPlugin.class);
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
    }
}
