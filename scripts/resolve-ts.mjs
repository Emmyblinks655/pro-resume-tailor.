import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const EXTENSIONS = [".ts", ".mts", ".tsx", ".js", ".mjs"];
const SRC = fileURLToPath(new URL("../src/", import.meta.url));

function hasExtension(specifier) {
  return EXTENSIONS.some((extension) => specifier.endsWith(extension));
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const file = path.join(SRC, specifier.slice(2));
    return nextResolve(pathToFileURL(hasExtension(file) ? file : `${file}.ts`).href, context);
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !hasExtension(specifier)) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}
