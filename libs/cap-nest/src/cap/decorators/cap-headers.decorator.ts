import 'reflect-metadata';

/** @internal */
export const CAP_HEADERS_PARAM_METADATA = 'CAP_HEADERS_PARAM_METADATA';

export function CapHeaders(): ParameterDecorator {
  return (
    target: object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ): void => {
    if (typeof propertyKey === 'undefined') {
      Reflect.defineMetadata(
        CAP_HEADERS_PARAM_METADATA,
        parameterIndex,
        target,
      );
      return;
    }

    Reflect.defineMetadata(
      CAP_HEADERS_PARAM_METADATA,
      parameterIndex,
      target,
      propertyKey,
    );
  };
}

/** @internal */
export function getCapHeadersParamIndex(
  target: object,
  propertyKey: string | symbol | undefined,
): number | undefined {
  if (typeof propertyKey === 'undefined') {
    return Reflect.getMetadata(CAP_HEADERS_PARAM_METADATA, target) as
      | number
      | undefined;
  }

  return Reflect.getMetadata(
    CAP_HEADERS_PARAM_METADATA,
    target,
    propertyKey,
  ) as number | undefined;
}
