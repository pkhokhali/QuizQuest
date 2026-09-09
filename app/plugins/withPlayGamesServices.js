const {
  withAndroidManifest,
  withStringsXml,
  withAppBuildGradle,
} = require("@expo/config-plugins");

/**
 * Expo Config Plugin for Google Play Games Services v2 integration.
 */
function withPlayGamesServices(config) {
  // 1. Inject com.google.android.gms.games.APP_ID into AndroidManifest.xml
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest?.application?.[0];
    if (!app) return cfg;

    app["meta-data"] = app["meta-data"] || [];
    const exists = app["meta-data"].some(
      (m) => m.$?.["android:name"] === "com.google.android.gms.games.APP_ID"
    );
    if (!exists) {
      app["meta-data"].push({
        $: {
          "android:name": "com.google.android.gms.games.APP_ID",
          "android:value": "@string/game_services_project_id",
        },
      });
    }
    return cfg;
  });

  // 2. Inject game_services_project_id into strings.xml
  config = withStringsXml(config, (cfg) => {
    cfg.modResults.resources = cfg.modResults.resources || {};
    cfg.modResults.resources.string = cfg.modResults.resources.string || [];

    const exists = cfg.modResults.resources.string.some(
      (s) => s.$?.name === "game_services_project_id"
    );
    if (!exists) {
      cfg.modResults.resources.string.push({
        $: {
          name: "game_services_project_id",
          translatable: "false",
        },
        _: "000000000000",
      });
    }
    return cfg;
  });

  // 3. Ensure play-services-games-v2 is in app/build.gradle
  config = withAppBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes("play-services-games-v2")) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation "com.google.android.gms:play-services-games-v2:+"`
      );
    }
    return cfg;
  });

  return config;
}

module.exports = withPlayGamesServices;
