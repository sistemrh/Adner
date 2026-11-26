package com.sistemrh.sil;

import android.app.Notification;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.json.JSONObject;

public class WhatsAppNotificationListener extends NotificationListenerService {
  private static final String SUPABASE_URL = "https://sqbzrwjctudhktfgdnkn.supabase.co/rest/v1/messages";
  private static final String SUPABASE_KEY = "sb_publishable_TOLM_QG6OEuogwUG5D6PKw_8dm-SJ6s";

  @Override
  public void onNotificationPosted(StatusBarNotification sbn) {
    String pkg = sbn.getPackageName();
    if (!pkg.equals("com.whatsapp") && !pkg.equals("com.whatsapp.w4b")) return;
    if (sbn.isOngoing()) return;

    Notification notification = sbn.getNotification();
    if (notification == null || notification.extras == null) return;

    CharSequence titleCs = notification.extras.getCharSequence(Notification.EXTRA_TITLE);
    CharSequence textCs = notification.extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
    if (textCs == null || textCs.length() == 0) {
      textCs = notification.extras.getCharSequence(Notification.EXTRA_TEXT);
    }
    String title = titleCs == null ? "" : titleCs.toString().trim();
    String text = textCs == null ? "" : textCs.toString().trim();
    if (title.length() == 0 || text.length() == 0) return;
    if (text.matches("^\\d+ novas? mensagens?$")) return;

    forwardToSupabase(pkg, title, text, sbn.getPostTime());
    NotificationListenerPlugin.onNotificationPosted(pkg, title, text, sbn.getPostTime());
  }

  private void forwardToSupabase(String pkg, String title, String text, long when) {
    new Thread(() -> {
      try {
        JSONObject body = new JSONObject();
        body.put("app", pkg);
        body.put("remetente", title);
        body.put("texto", text);
        body.put("recebida", Instant.ofEpochMilli(when).toString());

        HttpURLConnection conn = (HttpURLConnection) new URL(SUPABASE_URL).openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("apikey", SUPABASE_KEY);
        conn.setRequestProperty("Authorization", "Bearer " + SUPABASE_KEY);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Prefer", "return=minimal");
        conn.setDoOutput(true);
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(15000);
        try (OutputStream os = conn.getOutputStream()) {
          os.write(body.toString().getBytes(StandardCharsets.UTF_8));
        }
        conn.getResponseCode();
        conn.disconnect();
      } catch (Exception e) {
        // silencioso: a próxima notificação tenta de novo
      }
    }).start();
  }
}
