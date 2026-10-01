import { useState, useEffect } from 'react';

const API_BASE = '/api';

export function useFetch(url, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = async () => {
    // Allow callers to pass either "/dashboard" or a full "/api/..." / absolute URL.
    if (url == null) {
      setLoading(false);
      return;
    }
    const requestUrl = /^https?:\/\//.test(url) || url.startsWith(API_BASE)
      ? url
      : `${API_BASE}${url}`;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(requestUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, dependencies);

  return { data, loading, error, refetch };
}
