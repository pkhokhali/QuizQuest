// Base URL for the QuizQuest backend.
// - CI builds bake this in via the EXPO_PUBLIC_API_URL env var.
// - "localhost" only works in a simulator/emulator on the same machine.
//   When running on a physical device, replace with your computer's LAN IP,
//   e.g. "http://192.168.1.42:4000" (find it with `ipconfig` on Windows).
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";
