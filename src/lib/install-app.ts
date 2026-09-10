export const INSTALL_HINT_KEY = "iep-install-hint-dismissed";

export function isStandaloneDisplay(input: {
  displayModeStandalone: boolean;
  navigatorStandalone?: boolean;
}) {
  return input.displayModeStandalone || Boolean(input.navigatorStandalone);
}

export function shouldShowInstallHint(input: {
  displayModeStandalone: boolean;
  navigatorStandalone?: boolean;
  dismissed: boolean;
}) {
  if (input.dismissed) return false;
  return !isStandaloneDisplay(input);
}

export function installInstructions(userAgent: string): "ios" | "android" | "other" {
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/android/i.test(userAgent)) return "android";
  return "other";
}
