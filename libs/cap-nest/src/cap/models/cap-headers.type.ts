export type CapHeaderValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | Record<string, unknown>
  | unknown[];

export type CapHeaders = Record<string, CapHeaderValue>;
