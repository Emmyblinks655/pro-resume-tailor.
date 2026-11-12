const EXTENSIONS = [".ts", ".mts", ".js", ".mjs"];

function hasExtension(specifier) {
  return EXTENSIONS.some((extension) => specifier.endsWith(extension));
}

export async function resolve(specifier, context, nextResolve) {
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !hasExtension(specifier)) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}
