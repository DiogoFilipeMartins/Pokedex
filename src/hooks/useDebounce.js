import { useState, useEffect } from 'react';

/**
 * Hook para debounce - atrasa a atualização de um valor
 * @param {any} value - Valor a fazer debounce
 * @param {number} delay - Atraso em ms (padrão: 400ms)
 * @returns {any} Valor com debounce aplicado
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
