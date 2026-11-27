import io

p = "android/app/build.gradle"
s = io.open(p, encoding="utf-8").read()

if "signingConfigs.sil" not in s:
    signing = """    signingConfigs {
        sil {
            storeFile file("../../keystore/sil.keystore")
            storePassword "sil2026"
            storeType "PKCS12"
            keyAlias "sil"
            keyPassword "sil2026"
        }
    }
"""
    s = s.replace("    buildTypes {", signing + "    buildTypes {", 1)
    s = s.replace("debug {", "debug {\n            signingConfig signingConfigs.sil", 1)
    io.open(p, "w", encoding="utf-8").write(s)
    print("assinatura aplicada")
else:
    print("assinatura ja presente")
