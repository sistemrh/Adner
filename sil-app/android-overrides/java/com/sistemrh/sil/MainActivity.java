package com.sistemrh.sil;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(NotificationListenerPlugin.class);
    super.onCreate(savedInstanceState);
  }

  @Override
  public void onPause() {
    super.onPause();
    if (bridge != null && bridge.getWebView() != null) {
      bridge.getWebView().onResume();
      bridge.getWebView().resumeTimers();
    }
  }
}
