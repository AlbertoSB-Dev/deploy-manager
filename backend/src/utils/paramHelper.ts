/**
 * Helper para converter req.params para string
 * Express pode retornar string | string[] para params
 */

export function getParamAsString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] || '';
  }
  return param || '';
}

export function getParamAsNumber(param: string | string[] | undefined): number {
  const str = getParamAsString(param);
  return parseInt(str, 10);
}
