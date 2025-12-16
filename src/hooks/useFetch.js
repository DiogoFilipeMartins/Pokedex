import { useState, useEffect, useRef } from 'react';

/**
 * Hook robusto para fetch com AbortController, timeout e tratamento de erros
 * @param {string} url - URL para fazer fetch
 * @param {object} options - Opções adicionais (timeout, headers, etc.)
 * @returns {object} { data, loading, error, refetch }
 */
export function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const { timeout = 8000, autoFetch = true, ...fetchOptions } = options;

  const fetchData = async (customUrl = url) => {
    // Cancela requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    // Timeout
    const timeoutId = setTimeout(() => {
      abortControllerRef.current.abort();
    }, timeout);

    try {
      const response = await fetch(customUrl, {
        ...fetchOptions,
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      // Verifica !response.ok antes de processar
      if (!response.ok) {
        if (response.status === 404) {
          setData(null);
          setError({ type: 'empty', message: 'Nenhum resultado encontrado' });
        } else {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
      } else {
        const json = await response.json();
        
        // Retorna o objeto completo (não normaliza para não perder estrutura)
        setData(json);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        setError({ type: 'cancelled', message: 'Requisição cancelada' });
      } else if (err.message.includes('timeout') || err.name === 'AbortError') {
        setError({ type: 'timeout', message: 'Tempo limite excedido. Tente novamente.' });
      } else {
        setError({ type: 'error', message: err.message || 'Erro ao carregar dados' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && url) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url, autoFetch]);

  return { data, loading, error, refetch: fetchData };
}
