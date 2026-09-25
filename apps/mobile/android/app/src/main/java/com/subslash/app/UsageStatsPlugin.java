package com.subslash.app;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
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
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.json.JSONException;

/**
 * 구독한 서비스 앱을 이 폰에서 얼마나 썼는지 읽는다(apps/web/lib/usage/native.ts가 부른다). 폰 사용
 * 기록(query, 날짜별 합계)과 여러 기기 사용 측정(queryForeground, 구간)이 같은 플러그인·같은 판단을 쓴다.
 *
 * 안드로이드의 '사용 기록 액세스'(PACKAGE_USAGE_STATS)는 앱이 요청 창을 띄울 수 없고, 사용자가 설정
 * 화면에서 직접 켜야 한다. 그래서 여기서는 켜졌는지 확인하고 그 설정 화면을 열어 주기만 한다.
 *
 * 숫자는 이벤트 기록(queryEvents)에서 직접 센다. 운영체제가 모아 둔 하루치 통계(queryUsageStats)는
 * 기기마다 묶는 방식이 달라 '연 횟수'를 주지 않는다. 이벤트 기록은 오래 보관되지 않으므로(기기마다
 * 다르다) 화면 쪽이 하루에 한 번씩 읽어 기기에 쌓는다.
 *
 * 화면에 넘기는 것은 요청한 패키지(서비스 → 앱 연결표에 있는 것)의 날짜별 사용 시간과 쓴 횟수뿐이다.
 * 쓴 횟수(opens)는 세션 수다 — 기준은 SESSION_GAP_MS·MIN_SESSION_MS에 있다.
 * 다른 앱의 기록은 세는 데만 쓰고 넘기지 않는다.
 */
@CapacitorPlugin(name = "UsageStats")
public class UsageStatsPlugin extends Plugin {

    /**
     * '한 번 썼다'의 기준. 여러 기기 사용 측정(@subslash/shared의 linkSessions)과 같게 둔다 — 같은 리포트에
     * 이 폰의 횟수와 모든 기기의 횟수가 함께 나오므로, 기준이 다르면 같은 사용이 두 숫자로 읽힌다.
     * 앞 사용이 끝나고 SESSION_GAP_MS 안에 다시 쓰면 이어서 한 번이고, 모두 합쳐 MIN_SESSION_MS보다 짧으면
     * (알림을 눌러 잠깐 열린 것) 세지 않는다. 시간은 짧아도 그대로 더한다.
     */
    private static final long SESSION_GAP_MS = 30 * 60 * 1000L;
    private static final long MIN_SESSION_MS = 60 * 1000L;

    // UsageEvents.Event 상수. 뒤의 셋은 API 28·29에서 생겨 옛 기기에서는 오지 않는다.
    private static final int ACTIVITY_RESUMED = 1;
    private static final int ACTIVITY_PAUSED = 2;
    private static final int SCREEN_NON_INTERACTIVE = 16;
    private static final int KEYGUARD_SHOWN = 17;
    private static final int ACTIVITY_STOPPED = 23;
    private static final int DEVICE_SHUTDOWN = 26;

    @PluginMethod
    public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", isGranted());
        call.resolve(result);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        // 일부 기기는 패키지를 주면 SubSlash 항목을 바로 연다. 안 되면 목록 화면을 연다.
        intent.setData(Uri.parse("package:" + context.getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(intent);
        } catch (ActivityNotFoundException e) {
            Intent fallback = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                context.startActivity(fallback);
            } catch (ActivityNotFoundException again) {
                call.reject("사용 기록 액세스 설정을 열 수 없습니다");
                return;
            }
        }
        call.resolve();
    }

    /** 요청한 패키지 중 이 폰에 설치된 것. 설치 안 된 앱의 0회를 '안 썼다'로 읽지 않게 한다. */
    @PluginMethod
    public void installed(PluginCall call) {
        Set<String> wanted = readPackages(call);
        if (wanted == null) return;
        PackageManager pm = getContext().getPackageManager();
        JSArray found = new JSArray();
        for (String pkg : wanted) {
            try {
                pm.getPackageInfo(pkg, 0);
                found.put(pkg);
            } catch (PackageManager.NameNotFoundException ignored) {
                // 설치되지 않았거나 매니페스트 <queries>에 없는 패키지
            }
        }
        JSObject result = new JSObject();
        result.put("packages", found);
        call.resolve(result);
    }

    /**
     * 최근 days일(오늘 포함, 이 폰의 시간대 기준 자정부터)의 날짜별 사용 시간과 연 횟수.
     *
     * dataFrom은 받은 기록 중 가장 이른 시각이다. 요청한 시작보다 늦으면 그 앞은 운영체제가 이미
     * 지운 것이라 '모름'이다(0회가 아니다).
     */
    @PluginMethod
    public void query(PluginCall call) {
        if (!isGranted()) {
            call.reject("사용 기록 액세스가 꺼져 있습니다", "NOT_GRANTED");
            return;
        }
        Set<String> wanted = readPackages(call);
        if (wanted == null) return;
        int days = Math.max(1, Math.min(400, call.getInt("days", 30)));

        Calendar cal = Calendar.getInstance();
        long end = cal.getTimeInMillis();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        cal.add(Calendar.DAY_OF_MONTH, -(days - 1));
        long start = cal.getTimeInMillis();

        Tally tally = new Tally(wanted);
        long dataFrom = walkForeground(start, end, wanted, (pkg, from, to) -> {
            tally.open(pkg, from);
            tally.close(pkg, from, to);
        });
        tally.finish();

        JSObject result = new JSObject();
        result.put("from", start);
        result.put("dataFrom", dataFrom >= 0 ? dataFrom : JSObject.NULL);
        result.put("days", tally.toJSArray());
        call.resolve(result);
    }

    /** 여러 기기 측정이 조금 앞에서부터 읽는 시간. 기간 시작 전에 이미 앞에 있던 앱을 잡는다. */
    private static final long LOOK_BEHIND_MS = 3L * 60 * 60 * 1000;

    /**
     * from~to(epoch ms) 동안 packages의 앱이 앞에 있던 구간(여러 기기 사용 측정, apps/web/lib/device-usage-client).
     * 날짜별 합계(query)와 같은 판단(walkForeground)을 쓴다 — 같은 사용이 두 기능에서 다른 시간으로 잡히지
     * 않게. 운영체제가 이벤트를 며칠만 남기므로 실제로 이벤트가 있던 가장 이른 시각(firstEventAt)도 돌려준다.
     */
    @PluginMethod
    public void queryForeground(PluginCall call) {
        if (!isGranted()) {
            call.reject("사용 기록 액세스가 꺼져 있습니다", "NOT_GRANTED");
            return;
        }
        Long from = call.getLong("from");
        Long to = call.getLong("to");
        if (from == null || to == null || to <= from) {
            call.reject("from·to가 필요합니다");
            return;
        }
        Set<String> wanted = readPackages(call);
        if (wanted == null) return;

        long rangeFrom = from;
        long rangeTo = to;
        JSArray intervals = new JSArray();
        long firstEventAt = walkForeground(rangeFrom - LOOK_BEHIND_MS, rangeTo, wanted, (pkg, start, end) -> {
            long clippedStart = Math.max(start, rangeFrom);
            long clippedEnd = Math.min(end, rangeTo);
            if (clippedEnd <= clippedStart) return;
            JSObject interval = new JSObject();
            interval.put("packageName", pkg);
            interval.put("start", clippedStart);
            interval.put("end", clippedEnd);
            intervals.put(interval);
        });

        JSObject result = new JSObject();
        result.put("intervals", intervals);
        result.put("firstEventAt", firstEventAt >= 0 ? firstEventAt : JSObject.NULL);
        call.resolve(result);
    }

    private interface IntervalSink {
        void accept(String pkg, long start, long end);
    }

    /**
     * 이벤트 기록을 읽어 wanted 앱이 화면 맨 앞에 있던 구간을 sink로 넘긴다. 받은 기록 중 가장 이른 시각을
     * 돌려준다(없으면 -1).
     *
     * 한 번에 앞에 있는 앱은 하나다. 다른 앱이 열리거나 화면이 꺼지거나 잠기면 앞의 앱을 닫는다. 같은 앱
     * 안에서 화면만 바뀐 것은 이어지고, 잠깐 멈췄다(PAUSED) 다른 앱이 열리면 멈춘 시각에서 닫는다. 다른
     * 앱의 이벤트는 '누가 앞에 있나'를 아는 데만 쓰고 넘기지 않는다.
     *
     * 멈춤은 **지금 앞에 있는 화면(액티비티)**의 것만 본다. 화면이 여럿인 앱은 새 화면이 열린 뒤에 뒤로
     * 밀린 옛 화면의 STOPPED가 온다 — 앱 이름만 보고 그것을 멈춤으로 읽으면 마지막으로 화면이 바뀐
     * 시각에서 사용이 잘린다(에뮬레이터의 유튜브 94초가 32초로 잡혔다).
     */
    private long walkForeground(long start, long end, Set<String> wanted, IntervalSink sink) {
        UsageStatsManager usm = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
        UsageEvents events = usm.queryEvents(start, end);
        UsageEvents.Event event = new UsageEvents.Event();

        long firstEventAt = -1;
        String current = null;
        String currentActivity = null;
        long sessionStart = 0;
        long pausedAt = -1;

        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            long t = event.getTimeStamp();
            if (firstEventAt < 0) firstEventAt = t;
            int type = event.getEventType();
            String pkg = event.getPackageName();
            String activity = event.getClassName() == null ? "" : event.getClassName();

            if (type == ACTIVITY_RESUMED) {
                if (pkg.equals(current)) {
                    // 같은 앱 안에서 화면만 바뀐 것
                    currentActivity = activity;
                    pausedAt = -1;
                    continue;
                }
                if (current != null && wanted.contains(current)) {
                    sink.accept(current, sessionStart, pausedAt >= 0 ? pausedAt : t);
                }
                current = pkg;
                currentActivity = activity;
                sessionStart = t;
                pausedAt = -1;
            } else if (type == ACTIVITY_PAUSED || type == ACTIVITY_STOPPED) {
                if (pkg.equals(current) && activity.equals(currentActivity) && pausedAt < 0) pausedAt = t;
            } else if (type == SCREEN_NON_INTERACTIVE || type == KEYGUARD_SHOWN || type == DEVICE_SHUTDOWN) {
                if (current != null && wanted.contains(current)) {
                    sink.accept(current, sessionStart, pausedAt >= 0 ? pausedAt : t);
                }
                current = null;
                currentActivity = null;
                pausedAt = -1;
            }
        }
        if (current != null && wanted.contains(current)) {
            sink.accept(current, sessionStart, pausedAt >= 0 ? pausedAt : end);
        }
        return firstEventAt;
    }

    private boolean isGranted() {
        Context context = getContext();
        AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
        int mode;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            mode = appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.getPackageName());
        } else {
            mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.getPackageName());
        }
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    private Set<String> readPackages(PluginCall call) {
        JSArray array = call.getArray("packages");
        if (array == null) {
            call.reject("packages가 필요합니다");
            return null;
        }
        Set<String> set = new HashSet<>();
        try {
            for (int i = 0; i < array.length(); i++) set.add(array.getString(i));
        } catch (JSONException e) {
            call.reject("packages는 문자열 배열이어야 합니다");
            return null;
        }
        return set;
    }

    /** 요청한 패키지만 날짜별로 센다. */
    private static final class Tally {

        private final Set<String> wanted;
        private final Map<String, long[]> byKey = new HashMap<>(); // "날짜|패키지" → [ms, 쓴 횟수(세션)]
        /** 패키지 → 아직 닫지 않은 세션 [시작 시각, 사용한 ms, 마지막으로 나간 시각]. */
        private final Map<String, long[]> pending = new HashMap<>();
        private final SimpleDateFormat dayFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);

        Tally(Set<String> wanted) {
            this.wanted = wanted;
        }

        void open(String pkg, long t) {
            if (!wanted.contains(pkg)) return;
            long[] session = pending.get(pkg);
            if (session != null && t - session[2] <= SESSION_GAP_MS) return;
            if (session != null) countSession(pkg, session);
            pending.put(pkg, new long[] { t, 0, t });
        }

        /** 남은 세션을 모두 센다. 이벤트를 다 읽은 뒤 한 번 부른다. */
        void finish() {
            for (Map.Entry<String, long[]> e : pending.entrySet()) countSession(e.getKey(), e.getValue());
            pending.clear();
        }

        /** 세션은 시작한 날의 한 번으로 센다. */
        private void countSession(String pkg, long[] session) {
            if (session[1] >= MIN_SESSION_MS) entry(dayFormat.format(session[0]), pkg)[1] += 1;
        }

        void close(String pkg, long from, long to) {
            if (!wanted.contains(pkg)) return;
            long[] session = pending.get(pkg);
            if (session != null) {
                session[2] = Math.max(session[2], to);
                if (to > from) session[1] += to - from;
            }
            if (to <= from) return;
            // 자정을 넘긴 사용은 날짜별로 나눈다.
            Calendar cal = Calendar.getInstance();
            long cursor = from;
            while (cursor < to) {
                cal.setTimeInMillis(cursor);
                cal.set(Calendar.HOUR_OF_DAY, 0);
                cal.set(Calendar.MINUTE, 0);
                cal.set(Calendar.SECOND, 0);
                cal.set(Calendar.MILLISECOND, 0);
                cal.add(Calendar.DAY_OF_MONTH, 1);
                long segmentEnd = Math.min(to, cal.getTimeInMillis());
                entry(dayFormat.format(cursor), pkg)[0] += segmentEnd - cursor;
                cursor = segmentEnd;
            }
        }

        private long[] entry(String day, String pkg) {
            String key = day + "|" + pkg;
            long[] value = byKey.get(key);
            if (value == null) {
                value = new long[] { 0, 0 };
                byKey.put(key, value);
            }
            return value;
        }

        JSArray toJSArray() {
            JSArray array = new JSArray();
            for (Map.Entry<String, long[]> e : byKey.entrySet()) {
                String[] parts = e.getKey().split("\\|", 2);
                JSObject row = new JSObject();
                row.put("date", parts[0]);
                row.put("pkg", parts[1]);
                row.put("foregroundMs", e.getValue()[0]);
                row.put("opens", e.getValue()[1]);
                array.put(row);
            }
            return array;
        }
    }
}
