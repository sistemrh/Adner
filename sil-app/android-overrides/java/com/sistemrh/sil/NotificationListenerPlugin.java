package com.sistemrh.sil;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;

@CapacitorPlugin(
  name = "NotificationListener",
  permissions = { @Permission(alias = "mic", strings = { android.Manifest.permission.RECORD_AUDIO }) }
)
public class NotificationListenerPlugin extends Plugin {
  private static NotificationListenerPlugin instance;
  private SpeechRecognizer recognizer;

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

  private boolean hasMic() {
    return android.os.Build.VERSION.SDK_INT < 23
      || getContext().checkSelfPermission(android.Manifest.permission.RECORD_AUDIO)
           == android.content.pm.PackageManager.PERMISSION_GRANTED;
  }

  @PluginMethod
  public void micStatus(PluginCall call) {
    JSObject ret = new JSObject();
    ret.put("granted", hasMic());
    ret.put("available", SpeechRecognizer.isRecognitionAvailable(getContext()));
    ret.put("sdk", android.os.Build.VERSION.SDK_INT);
    ret.put("pkg", getContext().getPackageName());
    call.resolve(ret);
  }

  @PluginMethod
  public void requestMic(final PluginCall call) {
    if (hasMic()) {
      JSObject ok = new JSObject();
      ok.put("granted", true);
      call.resolve(ok);
      return;
    }
    requestPermissionForAlias("mic", call, "micResult");
  }

  @PermissionCallback
  private void micResult(PluginCall call) {
    JSObject ret = new JSObject();
    ret.put("granted", hasMic());
    call.resolve(ret);
  }

  @PluginMethod
  public void openAppSettings(PluginCall call) {
    Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
      Uri.fromParts("package", getContext().getPackageName(), null));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    getContext().startActivity(intent);
    call.resolve();
  }

  @PluginMethod
  public void startRecognition(final PluginCall call) {
    final Activity act = getActivity();
    if (act == null) {
      call.reject("Aplicativo sem atividade ativa", "unavailable");
      return;
    }
    if (!hasMic()) {
      call.reject("Permissão de microfone não concedida", "not-allowed");
      return;
    }
    if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
      call.reject("Reconhecimento de voz indisponível neste aparelho", "unavailable");
      return;
    }
    final String lang = call.getString("language", "pt-BR");
    act.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        beginListening(call, lang);
      }
    });
  }

  private void beginListening(final PluginCall call, String lang) {
    releaseRecognizer();
    recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
    Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang);
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
        data.put("transcript", matches.get(0));
        notifyListeners("recognitionPartial", data);
      }
      @Override public void onError(int error) {
        releaseRecognizer();
        call.reject(mensagemDeErro(error), codigoDeErro(error));
      }
      @Override public void onResults(Bundle results) {
        releaseRecognizer();
        JSObject data = new JSObject();
        JSArray alts = new JSArray();
        ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        float[] scores = results.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES);
        if (matches != null) {
          for (int i = 0; i < matches.size(); i++) {
            JSObject alt = new JSObject();
            alt.put("transcript", matches.get(i));
            alt.put("confidence", (scores != null && i < scores.length) ? scores[i] : 0.9);
            alts.put(alt);
          }
        }
        data.put("alternatives", alts);
        call.resolve(data);
      }
    });
    recognizer.startListening(intent);
  }

  private static String codigoDeErro(int error) {
    switch (error) {
      case SpeechRecognizer.ERROR_NO_MATCH:
      case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
        return "no-speech";
      case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
        return "not-allowed";
      case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
        return "busy";
      case SpeechRecognizer.ERROR_NETWORK:
      case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
      case SpeechRecognizer.ERROR_SERVER:
        return "network";
      default:
        return "mic";
    }
  }

  private static String mensagemDeErro(int error) {
    switch (error) {
      case SpeechRecognizer.ERROR_NO_MATCH: return "Não entendi o que foi dito";
      case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "Não ouvi nada";
      case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "Permissão de microfone negada";
      case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "Reconhecimento de voz ocupado";
      case SpeechRecognizer.ERROR_NETWORK: return "Sem internet para o reconhecimento de voz";
      case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "Internet demorou para responder";
      case SpeechRecognizer.ERROR_SERVER: return "Servidor de voz falhou";
      case SpeechRecognizer.ERROR_AUDIO: return "Erro na gravação do áudio";
      case SpeechRecognizer.ERROR_CLIENT: return "Erro interno de voz";
      default: return "Falha de voz, código " + error;
    }
  }

  @PluginMethod
  public void stopRecognition(PluginCall call) {
    final Activity act = getActivity();
    if (act == null) {
      releaseRecognizer();
      call.resolve();
      return;
    }
    act.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        releaseRecognizer();
      }
    });
    call.resolve();
  }

  private void releaseRecognizer() {
    if (recognizer != null) {
      try { recognizer.stopListening(); } catch (Exception e) { }
      try { recognizer.destroy(); } catch (Exception e) { }
      recognizer = null;
    }
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
