const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-audio',
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'audio',
  'AudioModule.kt'
);

if (!fs.existsSync(targetFile)) {
  console.log('[patch-expo-audio] expo-audio not found, skipping patch.');
  process.exit(0);
}

let content = fs.readFileSync(targetFile, 'utf8');
let modified = false;

// 1. Ensure auto-rewind on ended player before play
if (!content.includes('if (player.ref.playbackState == Player.STATE_ENDED)')) {
  content = content.replace(
    /runOnMain\s*\{\s*if\s*\(!focusAcquired\)\s*\{\s*requestAudioFocus\(\)\s*\}\s*player\.ref\.play\(\)/m,
    `runOnMain {\n          if (!focusAcquired) {\n            requestAudioFocus()\n          }\n          if (player.ref.playbackState == Player.STATE_ENDED) {\n            player.ref.seekTo(0)\n          }\n          player.ref.play()`
  );
  modified = true;
}

// 2. Ensure rawresource scheme support and RawResourceDataSource.buildRawResourceUri
if (!content.includes('RawResourceDataSource.buildRawResourceUri(resId)')) {
  content = content.replace(
    /private fun getRawResourceURI\(file: String\): Uri \{[\s\S]*?val resId = context\.resources\.getIdentifier\(file, "raw", context\.packageName\)[\s\S]*?else ->[\s\S]*?Uri\.Builder\(\)[\s\S]*?\.build\(\)\s*\}/m,
    `private fun getRawResourceURI(file: String): Uri {
    var resId = context.resources.getIdentifier(file, "raw", context.packageName)
    if (resId == 0) {
      resId = context.resources.getIdentifier("assets_$file", "raw", context.packageName)
    }
    if (resId == 0 && file.startsWith("assets_")) {
      resId = context.resources.getIdentifier(file.removePrefix("assets_"), "raw", context.packageName)
    }

    return when {
      resId == 0 ->
        Uri.fromFile(File(file))
      else ->
        androidx.media3.datasource.RawResourceDataSource.buildRawResourceUri(resId)
    }
  }`
  );

  content = content.replace(
    /private fun isRawResource\(uri: Uri\): Boolean =[\s\S]*?uri\.scheme == null \|\| \(uri\.scheme == "file" && uri\.path\?\.startsWith\("\/android_res\/raw\/"\) == true\)/,
    `private fun isRawResource(uri: Uri): Boolean =\n    uri.scheme == null || (uri.scheme == "file" && uri.path?.startsWith("/android_res/raw/") == true) || uri.scheme == "rawresource"`
  );

  content = content.replace(
    /val mediaItem = when \{\s*isRawResource\(uri\)/,
    `val mediaItem = when {\n      uri.scheme == "rawresource" -> MediaItem.fromUri(uri)\n      isRawResource(uri)`
  );

  modified = true;
}

if (modified) {
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('[patch-expo-audio] Successfully patched AudioModule.kt for raw audio resources & replay.');
} else {
  console.log('[patch-expo-audio] AudioModule.kt already up to date.');
}
