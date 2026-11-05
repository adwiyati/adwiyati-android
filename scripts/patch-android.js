// Adds what the generated Android project needs: alarm sounds, the notification icon,
// exact-alarm permissions and a version number that grows with every build.
const fs = require("fs"), path = require("path");
const A = "android/app/src/main";
const raw = path.join(A, "res/raw"); fs.mkdirSync(raw, { recursive: true });
fs.copyFileSync("www/voice/f-none.mp3", path.join(raw, "voice_f.mp3"));
fs.copyFileSync("www/voice/m-none.mp3", path.join(raw, "voice_m.mp3"));
fs.copyFileSync("www/voice/en-f-none.mp3", path.join(raw, "voice_en_f.mp3"));
fs.copyFileSync("www/voice/en-m-none.mp3", path.join(raw, "voice_en_m.mp3"));

const drawable = path.join(A, "res/drawable"); fs.mkdirSync(drawable, { recursive: true });
fs.writeFileSync(path.join(drawable, "ic_stat_pill.xml"),
`<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
  <path android:fillColor="#FFFFFFFF" android:pathData="M4.22,19.78a5,5 0,0 1,0 -7.07l8.49,-8.49a5,5 0,0 1,7.07 7.07l-8.49,8.49a5,5 0,0 1,-7.07 0zM8.46,8.46l-2.83,2.83a3,3 0,0 0,4.24 4.24l2.83,-2.83z"/>
</vector>
`);

const mf = path.join(A, "AndroidManifest.xml"); let m = fs.readFileSync(mf, "utf8");
// The Google Play build (PLAY=1) leaves out USE_EXACT_ALARM, which Play reserves for alarm-clock and calendar apps;
// it relies on SCHEDULE_EXACT_ALARM, which the app asks the user to allow.
const PLAY = process.env.PLAY === "1";
if (PLAY) m = m.replace(/\s*<uses-permission android:name="android\.permission\.USE_EXACT_ALARM"[^>]*\/>/g, "");
const perms = ["android.permission.POST_NOTIFICATIONS", ...(PLAY ? [] : ["android.permission.USE_EXACT_ALARM"]), "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.RECEIVE_BOOT_COMPLETED","android.permission.VIBRATE","android.permission.WAKE_LOCK"];
for (const p of perms) if (!m.includes(`"${p}"`)) m = m.replace("<application", `<uses-permission android:name="${p}" />\n    <application`);
fs.writeFileSync(mf, m);

const gf = "android/app/build.gradle"; let g = fs.readFileSync(gf, "utf8");
const code = process.env.VERSION_CODE || "1", name = process.env.VERSION_NAME || "1.0";
g = g.replace(/versionCode \d+/, `versionCode ${code}`).replace(/versionName "[^"]*"/, `versionName "${name}"`);
fs.writeFileSync(gf, g);
console.log("patched: sounds, icon, permissions, version", code, name);
