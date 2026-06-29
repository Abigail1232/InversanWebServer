import { useState, useCallback, useRef } from 'react';

/**
 * Hook para prevenir peticiones duplicadas
 * 
 * Este hook envuelve funciones asíncronas y previene que se ejecuten múltiples veces
 * simultáneamente, evitando así peticiones duplicadas cuando el usuario hace click
 * varias veces en un botón.
 * 
 * @example
 * const { execute, isLoading } = usePreventDuplicateRequest(asyncFunction);
 * 
 * <button onClick={execute} disabled={isLoading}>
 *   {isLoading ? 'Procesando...' : 'Enviar'}
 * </button>
 */
export function usePreventDuplicateRequest<T extends (...args: any[]) => Promise<any>>(
  asyncFunction: T,
  options?: {
    onSuccess?: (result: Awaited<ReturnType<T>>) => void;
    onError?: (error: Error) => void;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const isExecutingRef = useRef(false);

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | null> => {
      // Si ya se está ejecutando, no permitir otra ejecución
      if (isExecutingRef.current) {
        return null;
      }

      isExecutingRef.current = true;
      setIsLoading(true);

      try {
        const result = await asyncFunction(...args);
        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        options?.onError?.(errorObj);
        throw error;
      } finally {
        isExecutingRef.current = false;
        setIsLoading(false);
      }
    },
    [asyncFunction, options]
  );

  return { execute, isLoading };
}

/**
 * Hook simplificado para prevenir peticiones duplicadas sin callbacks
 * Útil para casos simples donde solo necesitas prevenir duplicados
 */
export function usePreventDuplicate<T extends (...args: any[]) => Promise<any>>(
  asyncFunction: T
) {
  const [isLoading, setIsLoading] = useState(false);
  const isExecutingRef = useRef(false);

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | null> => {
      if (isExecutingRef.current) {
        return null;
      }

      isExecutingRef.current = true;
      setIsLoading(true);

      try {
        const result = await asyncFunction(...args);
        return result;
      } finally {
        isExecutingRef.current = false;
        setIsLoading(false);
      }
    },
    [asyncFunction]
  );

  return { execute, isLoading };
}
