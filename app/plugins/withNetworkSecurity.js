const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const NETWORK_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <!-- Allow http:// LAN IPs (e.g. http://192.168.0.111:4000) for same-Wi-Fi dev/testing. -->
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
</network-security-config>
`;

/** Ensures release APKs can call plain-HTTP API on the local network. */
function withNetworkSecurityConfig(config) {
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest?.application?.[0];
    if (!app) {
      throw new Error("AndroidManifest.xml is missing <application>");
    }
    app.$ = app.$ || {};
    app.$["android:usesCleartextTraffic"] = "true";
    app.$["android:networkSecurityConfig"] = "@xml/network_security_config";
    return cfg;
  });

  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const xmlDir = path.join(
        cfg.modRequest.platformProjectRoot,
        "app/src/main/res/xml"
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, "network_security_config.xml"), NETWORK_XML);
      return cfg;
    },
  ]);
}

module.exports = withNetworkSecurityConfig;
