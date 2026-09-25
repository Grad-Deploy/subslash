package com.subslash.app;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Process;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import org.json.JSONException;

/**
 * 이 기기에서 서비스 앱이 화면 맨 앞에 있던 구간을 잰다(apps/web/lib/device-usage-native가 부른다).
 *
 * '사용 정보 접근'은 런타임 권한 창이 없고 사용자가 설정 화면에서 직접 켜야 한다. 켜지 않았으면
 * 아무것도 재지 않는다. 화면이 넘긴 패키지 이름만 보고, 그 밖의 앱 이름은 화면으로 넘기지 않는다.
 *
 * 잴 수 있는 것은 앱의 화면(액티비티)이 앞에 있던 시간뿐이다 — 화면을 끈 채 재생하는 음악, 재생
 * 배속, 무엇을 봤는지는 알 수 없다.
 */
@CapacitorPlugin(name = "DeviceUsage")
public class DeviceUsagePlugin extends Plugin {

    private boolean hasUsageAccess() {
        Context context = getContext();
        AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
        int mode;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            mode = appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.getPackageName());
        } else {
            mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.getPackageName());
        }
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    @PluginMethod
    public void hasAccess(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasUsageAccess());
        call.resolve(result);
    }

    /** 사용 정보 접근 설정을 연다. 돌아왔는지는 화면이 다시 hasAccess로 확인한다. */
    @PluginMethod
    public void openAccessSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        // 안드로이드 10부터 일부 기기는 이 앱의 항목을 바로 연다. 안 되는 기기는 목록이 열린다.
        intent.setData(Uri.parse("package:" + getContext().getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(intent);
        } catch (Exception e) {
            Intent fallback = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(fallback);
        }
        call.resolve();
    }

    /**
     * from~to(epoch ms) 동안 packages의 앱이 앞에 있던 구간을 돌려준다. 기간 앞에서 이미 열려
     * 있던 앱을 잡으려고 조금 앞에서부터 읽고, 결과는 기간 안으로 자른다.
     *
     * 운영체제가 사용 이벤트를 며칠만 남기므로, 오래 열지 않은 기기는 앞부분이 비어 있을 수 있다.
     * 그래서 실제로 이벤트가 있던 가장 이른 시각(firstEventAt)을 함께 돌려준다.
     */
    @PluginMethod
    public void queryForeground(PluginCall call) {
        if (!hasUsageAccess()) {
            call.reject("사용 정보 접근이 꺼져 있습니다.", "NO_ACCESS");
            return;
        }
        Long from = call.getLong("from");
        Long to = call.getLong("to");
        JSArray packageArray = call.getArray("packages");
        if (from == null || to == null || to <= from || packageArray == null) {
            call.reject("from·to·packages가 필요합니다.");
            return;
        }
        Set<String> packages = new HashSet<>();
        try {
            for (int i = 0; i < packageArray.length(); i++) packages.add(packageArray.getString(i));
        } catch (JSONException e) {
            call.reject("packages는 문자열 목록이어야 합니다.");
            return;
        }

        UsageStatsManager manager =
            (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
        long lookBehind = 3L * 60 * 60 * 1000;
        UsageEvents events = manager.queryEvents(from - lookBehind, to);
        UsageEvents.Event event = new UsageEvents.Event();

        // 패키지마다 지금 앞에 있는 액티비티들. 같은 앱 안에서 화면이 바뀌면 새 화면이 먼저 열리고
        // 옛 화면이 나중에 닫히기도 해서, 하나라도 열려 있는 동안을 한 구간으로 본다.
        Map<String, Set<String>> resumed = new HashMap<>();
        Map<String, Long> openedAt = new HashMap<>();
        JSArray intervals = new JSArray();
        long firstEventAt = -1;

        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            long time = event.getTimeStamp();
            if (firstEventAt < 0) firstEventAt = time;
            int type = event.getEventType();

            // 화면이 꺼지거나 기기가 꺼지면 열려 있던 앱을 모두 닫는다.
            if ((Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                    && type == UsageEvents.Event.SCREEN_NON_INTERACTIVE)
                || type == 26 /* DEVICE_SHUTDOWN, API 29 */) {
                for (String pkg : new HashSet<>(openedAt.keySet())) {
                    addInterval(intervals, pkg, openedAt.remove(pkg), time, from, to);
                }
                resumed.clear();
                continue;
            }

            String pkg = event.getPackageName();
            if (!packages.contains(pkg)) continue;
            String activity = event.getClassName() == null ? "" : event.getClassName();

            if (type == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                Set<String> open = resumed.computeIfAbsent(pkg, k -> new HashSet<>());
                if (open.isEmpty()) openedAt.put(pkg, time);
                open.add(activity);
            } else if (type == UsageEvents.Event.MOVE_TO_BACKGROUND) {
                Set<String> open = resumed.get(pkg);
                if (open == null) continue;
                open.remove(activity);
                if (open.isEmpty() && openedAt.containsKey(pkg)) {
                    addInterval(intervals, pkg, openedAt.remove(pkg), time, from, to);
                }
            }
        }
        // 아직 앞에 있는 앱은 기간 끝에서 자른다.
        for (Map.Entry<String, Long> open : openedAt.entrySet()) {
            addInterval(intervals, open.getKey(), open.getValue(), to, from, to);
        }

        JSObject result = new JSObject();
        result.put("intervals", intervals);
        result.put("firstEventAt", firstEventAt < 0 ? null : firstEventAt);
        call.resolve(result);
    }

    private static void addInterval(
        JSArray intervals, String pkg, Long start, long end, long from, long to) {
        if (start == null) return;
        long clippedStart = Math.max(start, from);
        long clippedEnd = Math.min(end, to);
        if (clippedEnd <= clippedStart) return;
        JSObject interval = new JSObject();
        interval.put("packageName", pkg);
        interval.put("start", clippedStart);
        interval.put("end", clippedEnd);
        intervals.put(interval);
    }
}
