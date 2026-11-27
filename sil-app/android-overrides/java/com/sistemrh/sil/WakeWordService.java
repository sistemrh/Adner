package com.sistemrh.sil;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.PowerManager;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import com.getcapacitor.JSObject;
import java.util.ArrayList;

public class WakeWordService extends Service {
  private static final String CANAL = "tiz_escuta";
  private SpeechRecognizer recognizer;
  private PowerManager.WakeLock wakeLock;
  private final Handler handler = new Handler();
  private boolean rodando = false;

  @Override
  public void onCreate() {
    super.onCreate();
    rodando = true;
    iniciarNotificacao();
    manterAcordado();
    iniciarEscuta();
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    if (!rodando) {
      rodando = true;
      iniciarEscuta();
    }
    return START_STICKY;
  }

  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  private void iniciarNotificacao() {
    NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
    Notification.Builder builder;
    if (Build.VERSION.SDK_INT >= 26) {
      NotificationChannel canal = new NotificationChannel(CANAL, "Tiz", NotificationManager.IMPORTANCE_LOW);
      canal.setSound(null, null);
      nm.createNotificationChannel(canal);
      builder = new Notification.Builder(this, CANAL);
    } else {
      builder = new Notification.Builder(this);
      builder.setPriority(Notification.PRIORITY_LOW);
    }
    builder.setContentTitle("Tiz")
      .setContentText("Ouvindo. Diga \"Tiz\" para ativar.")
      .setSmallIcon(android.R.drawable.ic_btn_speak_now)
      .setOngoing(true);
    startForeground(1, builder.build());
  }

  private void manterAcordado() {
    try {
      PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
      wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Tiz:escuta");
      wakeLock.setReferenceCounted(false);
      wakeLock.acquire();
    } catch (Exception e) {
      wakeLock = null;
    }
  }

  private void iniciarEscuta() {
    if (!SpeechRecognizer.isRecognitionAvailable(this)) {
      return;
    }
    pararReconhecedor();
    recognizer = SpeechRecognizer.createSpeechRecognizer(this);
    Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-BR");
    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "pt-BR");
    intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
    intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
    recognizer.setRecognitionListener(new RecognitionListener() {
      @Override public void onReadyForSpeech(Bundle params) { }
      @Override public void onBeginningOfSpeech() { }
      @Override public void onRmsChanged(float rmsdB) { }
      @Override public void onBufferReceived(byte[] buffer) { }
      @Override public void onEndOfSpeech() { }
      @Override public void onEvent(int eventType, Bundle params) { }
      @Override public void onPartialResults(Bundle partialResults) {
        ArrayList<String> matches = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (matches == null || matches.isEmpty()) return;
        JSObject data = new JSObject();
        data.put("text", matches.get(0));
        NotificationListenerPlugin.emit("wakePartial", data);
      }
      @Override public void onError(int error) {
        reagendar(1500);
      }
      @Override public void onResults(Bundle results) {
        ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (matches != null && !matches.isEmpty()) {
          JSObject data = new JSObject();
          data.put("text", matches.get(0));
          NotificationListenerPlugin.emit("wakeResult", data);
        }
        reagendar(300);
      }
    });
    recognizer.startListening(intent);
  }

  private void reagendar(long ms) {
    pararReconhecedor();
    handler.postDelayed(() -> {
      if (rodando) iniciarEscuta();
    }, ms);
  }

  private void pararReconhecedor() {
    if (recognizer != null) {
      try { recognizer.stopListening(); } catch (Exception e) { }
      try { recognizer.destroy(); } catch (Exception e) { }
      recognizer = null;
    }
  }

  @Override
  public void onDestroy() {
    rodando = false;
    handler.removeCallbacksAndMessages(null);
    pararReconhecedor();
    if (wakeLock != null) {
      try { wakeLock.release(); } catch (Exception e) { }
      wakeLock = null;
    }
    super.onDestroy();
  }
}
