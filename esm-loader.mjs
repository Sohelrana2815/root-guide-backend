import { pathToFileURL } from 'url';

export function resolve(specifier, context, defaultResolve) {
  const { parentURL = pathToFileURL(process.cwd()).href } = context;
  return defaultResolve(specifier, context, defaultResolve);
}

export function getFormat(url, context, defaultGetFormat) {
  return defaultGetFormat(url, context, defaultGetFormat);
}

export function transformSource(source, context, defaultTransformSource) {
  return defaultTransformSource(source, context, defaultTransformSource);
}

export function load(url, context, defaultLoad) {
  return defaultLoad(url, context, defaultLoad);
}
