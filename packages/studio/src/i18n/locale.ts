import { zhCN } from "./zh-CN";
export type StudioLocale = "zh-CN" | "en";
const storageKey = "hyperframes.studio.locale";
export function getStudioLocale(): StudioLocale {
  if (typeof window === "undefined") return "en";
  try {
    return window.localStorage.getItem(storageKey) === "en" ? "en" : "zh-CN";
  } catch {
    return "zh-CN";
  }
}
export function translateLabel(label: string, locale: StudioLocale): string {
  return locale === "zh-CN" ? (zhCN[label] ?? label) : label;
}
export function t(label: string): string {
  return translateLabel(label, getStudioLocale());
}
export function setStudioLocale(locale: StudioLocale): void {
  try {
    window.localStorage.setItem(storageKey, locale);
  } catch {
    return;
  }
  // Reload the chrome so module-level menu definitions use the same locale.
  window.location.reload();
}
