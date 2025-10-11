declare module 'js-yaml' {
  export function load(str: string, options?: unknown): unknown;
  export function dump(obj: unknown, options?: unknown): string;
}
