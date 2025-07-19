// tests/unit/hooks/useApi.test.js - Unit tests for useApi hook

import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '../../../hooks/useApi';

// Mock fetch globally
global.fetch = jest.fn();

describe('useApi Hook', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should initialize with default values', () => {
    // Mock fetch to prevent actual call
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    const { result } = renderHook(() => useApi('/test', {}, false));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.execute).toBe('function');
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should make API call immediately when immediate is true', async () => {
    const mockData = { message: 'success' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useApi('/test'));

    // Initially loading should be true
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith('/test', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should not make API call when immediate is false', () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    renderHook(() => useApi('/test', {}, false));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useApi('/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('HTTP error! status: 404');
  });

  it('should handle network errors', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useApi('/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('should allow manual execution with execute method', async () => {
    const mockData = { id: 1, name: 'Test' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useApi('/test', {}, false));

    expect(result.current.data).toBeNull();

    await waitFor(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should merge options with override options in execute', async () => {
    const mockData = { result: 'ok' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const defaultOptions = {
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
    };

    const { result } = renderHook(() => useApi('/test', defaultOptions, false));

    await waitFor(async () => {
      await result.current.execute({
        method: 'POST',
        body: JSON.stringify({ test: true }),
      });
    });

    expect(global.fetch).toHaveBeenCalledWith('/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
      body: JSON.stringify({ test: true }),
    });
  });

  it('should refetch data when refetch is called', async () => {
    const mockData1 = { version: 1 };
    const mockData2 = { version: 2 };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData2,
      });

    const { result } = renderHook(() => useApi('/test'));

    // Wait for initial call
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    // Call refetch
    await waitFor(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual(mockData2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should update loading state correctly during execution', async () => {
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    global.fetch.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useApi('/test', {}, false));

    // Start execution
    const executePromise = result.current.execute();
    
    // Should be loading
    expect(result.current.loading).toBe(true);

    // Resolve the fetch promise
    resolvePromise({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    await executePromise;

    // Should no longer be loading
    expect(result.current.loading).toBe(false);
  });
});
