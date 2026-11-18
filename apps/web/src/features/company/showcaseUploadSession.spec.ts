import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadImage } from '@/lib/mediaUpload';
import { api } from '@/lib/apiClient';
import {
  enqueueShowcaseUploads,
  getShowcasePending,
  isShowcaseUploading,
  resetShowcaseUploadSessionForTests,
  subscribeShowcaseUploadSession,
} from './showcaseUploadSession';

vi.mock('@/lib/mediaUpload', () => ({
  uploadImage: vi.fn(),
}));

vi.mock('@/lib/apiClient', () => ({
  api: { patch: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

describe('showcaseUploadSession', () => {
  const companyId = 'seed-company-meena';
  let client: QueryClient;
  let urls: string[];
  const onToast = vi.fn();

  beforeEach(() => {
    resetShowcaseUploadSessionForTests();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    urls = [];
    onToast.mockReset();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:pending'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
    vi.mocked(api.patch).mockImplementation(async (_path, body) => {
      const next = (body as { showcaseUrls: string[] }).showcaseUrls;
      urls = next;
      return { id: companyId, showcaseUrls: next };
    });
  });

  afterEach(() => {
    resetShowcaseUploadSessionForTests();
    vi.clearAllMocks();
  });

  it('appends progressively as each upload finishes', async () => {
    let resolveFirst!: (url: string) => void;
    let resolveSecond!: (url: string) => void;
    vi.mocked(uploadImage)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );

    const snapshots: number[] = [];
    const stop = subscribeShowcaseUploadSession(companyId, () => {
      snapshots.push(getShowcasePending(companyId).length);
    });

    enqueueShowcaseUploads(
      companyId,
      [
        new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
        new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
      ],
      {
        queryClient: client,
        getUrls: () => urls,
        onToast,
      },
    );

    expect(getShowcasePending(companyId)).toHaveLength(2);
    expect(isShowcaseUploading(companyId)).toBe(true);

    await vi.waitFor(() => expect(typeof resolveFirst).toBe('function'));
    resolveFirst('https://cdn/a.jpg');
    await vi.waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    expect(api.patch).toHaveBeenLastCalledWith('/companies/me', {
      showcaseUrls: ['https://cdn/a.jpg'],
    });
    expect(getShowcasePending(companyId)).toHaveLength(1);

    await vi.waitFor(() => expect(typeof resolveSecond).toBe('function'));
    resolveSecond('https://cdn/b.jpg');
    await vi.waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2));
    expect(api.patch).toHaveBeenLastCalledWith('/companies/me', {
      showcaseUrls: ['https://cdn/a.jpg', 'https://cdn/b.jpg'],
    });
    await vi.waitFor(() => expect(getShowcasePending(companyId)).toHaveLength(0));
    expect(isShowcaseUploading(companyId)).toBe(false);
    expect(snapshots.some((n) => n === 2)).toBe(true);
    stop();
  });

  it('keeps committing after subscribers leave (sheet closed)', async () => {
    let resolveUpload!: (url: string) => void;
    vi.mocked(uploadImage).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        }),
    );

    const stop = subscribeShowcaseUploadSession(companyId, () => undefined);
    enqueueShowcaseUploads(
      companyId,
      [new File(['a'], 'a.jpg', { type: 'image/jpeg' })],
      {
        queryClient: client,
        getUrls: () => urls,
        onToast,
      },
    );
    stop();

    await vi.waitFor(() => expect(typeof resolveUpload).toBe('function'));
    resolveUpload('https://cdn/after-close.jpg');
    await vi.waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/companies/me', {
        showcaseUrls: ['https://cdn/after-close.jpg'],
      }),
    );
  });

  it('toasts when some uploads fail', async () => {
    vi.mocked(uploadImage)
      .mockResolvedValueOnce('https://cdn/ok.jpg')
      .mockRejectedValueOnce(new Error('fail'));

    enqueueShowcaseUploads(
      companyId,
      [
        new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
        new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
      ],
      {
        queryClient: client,
        getUrls: () => urls,
        onToast,
      },
    );

    await vi.waitFor(() => expect(onToast).toHaveBeenCalled());
    expect(onToast).toHaveBeenCalledWith('1 photo added; 1 failed.', 'danger');
    expect(api.patch).toHaveBeenCalledWith('/companies/me', {
      showcaseUrls: ['https://cdn/ok.jpg'],
    });
  });
});
