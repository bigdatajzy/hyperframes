import type { LintContext, HyperframeLintFinding, OpenTag } from "../context";
import { readAttr, truncateSnippet } from "../utils";

const URL_ATTRS = ["src", "href", "poster", "xlink:href"];
const ROOT_PATH = /^\/(?!\/)/;
const CSS_ROOT_URL = /\burl\(\s*["']?(\/(?!\/)[^"')\s]*)/g;
// Module imports of root paths are not here: the preview maps them to the project (studio-server rootImportMap).
const SCRIPT_ROOT_URL = /\b(?:fetch|new\s+URL)\(\s*(["'`])(\/(?!\/)[^"'`$]*)\1/g;

/** `path` ("/assets/x.png") without its slash, as every composition file names project files (the preview resolves
 * them from the project root); a stylesheet file at `cssFile` resolves url() from its own folder. */
function relativeForm(path: string, cssFile?: string): string {
  const depth = (cssFile ?? "").split("/").filter(Boolean).length - 1;
  return `${"../".repeat(Math.max(depth, 0))}${path.slice(1)}`;
}

function rootPathFinding(
  path: string,
  cssFile: string | undefined,
  snippet: string,
): HyperframeLintFinding {
  return {
    code: "root_path_missing_in_preview",
    severity: "warning",
    message: `"${path}" starts at the server's root. Render and snapshot serve the project there, but Studio's preview serves it under the project's own path, so the preview cannot find this file.`,
    fixHint: `Use "${relativeForm(path, cssFile)}" instead.`,
    snippet: truncateSnippet(snippet),
  };
}

function cssRootPaths(css: string, cssFile?: string): HyperframeLintFinding[] {
  return [...css.matchAll(CSS_ROOT_URL)].map((match) =>
    rootPathFinding(match[1] ?? "", cssFile, match[0]),
  );
}

function tagRootPaths(tag: OpenTag): HyperframeLintFinding[] {
  if (tag.name === "a" || tag.name === "base") return [];
  const paths = URL_ATTRS.map((attr) => readAttr(tag.raw, attr)?.trim() ?? "").filter((value) =>
    ROOT_PATH.test(value),
  );
  return [
    ...paths.map((path) => rootPathFinding(path, undefined, tag.raw)),
    ...cssRootPaths(readAttr(tag.raw, "style") ?? ""),
  ];
}

const scriptRootPaths = (script: string): HyperframeLintFinding[] =>
  [...script.matchAll(SCRIPT_ROOT_URL)].map((match) =>
    rootPathFinding(match[2] ?? "", undefined, match[0]),
  );

export const rootPathRules: Array<(ctx: LintContext) => HyperframeLintFinding[]> = [
  (ctx) => [
    ...ctx.tags.flatMap(tagRootPaths),
    ...ctx.styles.flatMap((style) => cssRootPaths(style.content, style.rootRelativePath)),
    ...ctx.scripts.flatMap((script) => scriptRootPaths(script.content)),
  ],
];
