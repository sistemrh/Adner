package com.sistemrh.sil;

import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotificationListener")
public class NotificationListenerPlugin extends Plugin {
  private static NotificationListenerPlugin instance;

  @Override
  public void load() {
    instance = this;
  }

  @PluginMethod
  public void hasPermission(PluginCall call) {
    String flat = Settings.Secure.getString(getContext().getContentResolver(), "enabled_notification_listeners");
    JSObject ret = new JSObject();
    ret.put("granted", flat != null && flat.contains(getContext().getPackageName()));
    call.resolve(ret);
  }

  @PluginMethod
  public void dial(PluginCall call) {
    String numero = call.getString("numero", "");
    if (numero == null || numero.replace("[^0-9+]", "").length() < 8) {
      call.reject("Número inválido");
      return;
    }
    Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + numero));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    getContext().startActivity(intent);
    call.resolve();
  }

  @PluginMethod
  public void openSettings(PluginCall call) {
    Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    getContext().startActivity(intent);
    call.resolve();
  }

  public static void onNotificationPosted(String pkg, String title, String text, long when) {
    if (instance == null) return;
    JSObject data = new JSObject();
    data.put("app", pkg);
    data.put("titulo", title == null ? "" : title);
    data.put("texto", text == null ? "" : text);
    data.put("quando", when);
    instance.notifyListeners("notificationReceived", data);
  }
}
