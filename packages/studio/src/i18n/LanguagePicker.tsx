import { getStudioLocale, setStudioLocale } from "./locale";
export function LanguagePicker() {
  return (
    <select
      aria-label="界面语言 / Interface language"
      title="切换界面语言（自动重新加载） / Switch language (reloads Studio)"
      className="h-ctl rounded-md border border-border-strong bg-bg-2 px-2 text-text-1 text-step-11"
      value={getStudioLocale()}
      onChange={(event) => {
        const locale = event.target.value;
        if (locale === "en" || locale === "zh-CN") setStudioLocale(locale);
      }}
    >
      <option value="zh-CN">简体中文</option>
      <option value="en">English</option>
    </select>
  );
}
