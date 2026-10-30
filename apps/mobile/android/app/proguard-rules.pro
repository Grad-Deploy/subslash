# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# 카카오 SDK(KakaoLoginPlugin). 카카오 개발 문서(안드로이드 > 설정하기 > 난독화)의 규칙이다. 응답 모델을
# 이름으로 읽으므로(Gson·Retrofit) 지우면 릴리스 빌드에서만 로그인이 조용히 실패한다.
-keep class com.kakao.sdk.**.model.* { <fields>; }
-keep class * extends com.google.gson.TypeAdapter
-dontwarn org.bouncycastle.jsse.**
-dontwarn org.conscrypt.*
-dontwarn org.openjsse.**
-if interface * { @retrofit2.http.* <methods>; }
-keep,allowobfuscation interface <1>
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation
-if interface * { @retrofit2.http.* public *** *(...); }
-keep,allowoptimization,allowshrinking,allowobfuscation class <3>
-keep,allowobfuscation,allowshrinking class retrofit2.Response

# 더 넓은 화면(edge-to-edge). Play Console은 앱이 EdgeToEdge.enable()을 부르는지 dex에서 찾는다. 규칙이 없으면
# R8이 이 메서드를 MainActivity.onCreate 안으로 인라인하고 클래스 이름도 바꿔(androidx.activity.s), 부르고
# 있는데도 '일부 사용자에게는 더 넓은 화면이 표시되지 않을 수 있습니다' 경고가 남았다.
-keep class androidx.activity.EdgeToEdge {
    public static void enable(...);
}
