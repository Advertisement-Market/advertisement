import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import {
  api,
  apiErrorMessage,
  normalizePathname,
  registerSessionExpiredHandler,
  registerSessionRefreshedHandler,
  resetSessionExpiryGuard,
} from './apiClient';
import { authStorage } from './authStorage';
import {
  saveOwnerRegisterDraft,
  loadOwnerRegisterDraft,
} from '@/pages/OwnerRegister/ownerDraftStorage';

describe('apiErrorMessage helper', () => {
  it('formats fieldErrors.typeOther with human-readable field label prefix', () => {
    const error = {
      response: {
        status: 400,
        data: {
          errorCode: 'VALIDATION_FAILED',
          fieldErrors: {
            typeOther: "A description is required when the selection is 'Other'.",
          },
        },
      },
    };
    expect(apiErrorMessage(error)).toBe(
      "Billboard Type: A description is required when the selection is 'Other'.",
    );
  });

  it('formats fieldErrors.trafficTypeOther with human-readable field label prefix', () => {
    const error = {
      response: {
        status: 400,
        data: {
          errorCode: 'VALIDATION_FAILED',
          fieldErrors: {
            trafficTypeOther: "A description is required when the selection is 'Other'.",
          },
        },
      },
    };
    expect(apiErrorMessage(error)).toBe(
      "Traffic Type: A description is required when the selection is 'Other'.",
    );
  });

  it('formats fieldErrors.audienceTypeOther with human-readable field label prefix', () => {
    const error = {
      response: {
        status: 400,
        data: {
          errorCode: 'VALIDATION_FAILED',
          fieldErrors: {
            audienceTypeOther: "A description is required when the selection is 'Other'.",
          },
        },
      },
    };
    expect(apiErrorMessage(error)).toBe(
      "Audience Type: A description is required when the selection is 'Other'.",
    );
  });

  it('returns raw message if field is not in FIELD_LABELS dictionary', () => {
    const error = {
      response: {
        status: 400,
        data: {
          errorCode: 'VALIDATION_FAILED',
          fieldErrors: {
            customField: 'Custom error message.',
          },
        },
      },
    };
    expect(apiErrorMessage(error)).toBe('Custom error message.');
  });

  it('returns top-level message if present', () => {
    const error = {
      response: {
        data: {
          message: 'An explicit top-level error occurred.',
        },
      },
    };
    expect(apiErrorMessage(error)).toBe('An explicit top-level error occurred.');
  });

  it('prefers fieldErrors over generic top-level message when both are present', () => {
    const error = {
      response: {
        status: 400,
        data: {
          errorCode: 'VALIDATION_FAILED',
          message: 'Validation failed.',
          fieldErrors: {
            typeOther: "A description is required when the selection is 'Other'.",
          },
        },
      },
    };
    expect(apiErrorMessage(error)).toBe(
      "Billboard Type: A description is required when the selection is 'Other'.",
    );
  });

  it('falls back to retry-friendly message for CONCURRENT_MODIFICATION errorCode', () => {
    const error = {
      response: {
        status: 409,
        data: {
          errorCode: 'CONCURRENT_MODIFICATION',
        },
      },
    };
    expect(apiErrorMessage(error)).toMatch(/already in progress/i);
  });

  it('handles network errors gracefully', () => {
    const error = { code: 'ERR_NETWORK' };
    expect(apiErrorMessage(error)).toBe(
      'Cannot reach the server. Make sure the backend is running.',
    );
  });

  it('returns fallback message when error data is unavailable', () => {
    expect(apiErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
  });
});

describe('normalizePathname', () => {
  it('normalizes trailing slashes, query strings, and custom baseURLs', () => {
    expect(normalizePathname('/api/auth/login/?next=/home', '')).toBe('/api/auth/login');
    expect(normalizePathname('/api/onboarding/owner/', 'https://api.example.com')).toBe(
      '/api/onboarding/owner',
    );
    expect(normalizePathname('/api/auth/me?fields=role', '')).toBe('/api/auth/me');
  });
});

describe('apiClient 401 refresh & replay interceptor', () => {
  let originalAdapter;
  let refreshPostSpy;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetSessionExpiryGuard();
    originalAdapter = api.defaults.adapter;
    authStorage.setSession({
      accessToken: 'EXPIRED_MEMBER_TOKEN',
      user: { id: 10, email: 'member@example.com', role: 'MEMBER' },
    });
    refreshPostSpy = vi.spyOn(axios, 'post');
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    refreshPostSpy.mockRestore();
    registerSessionExpiredHandler(null);
    registerSessionRefreshedHandler(null);
  });

  it('refreshes once on 401 for POST /api/onboarding/owner and replays with new bearer token and single-encoded JSON body', async () => {
    const seenRequests = [];

    api.defaults.adapter = async (config) => {
      const authHeader =
        typeof config.headers?.get === 'function'
          ? config.headers.get('Authorization')
          : config.headers?.Authorization;
      seenRequests.push({ authHeader, data: config.data });

      if (seenRequests.length === 1) {
        const err = new Error('Unauthorized');
        err.config = config;
        err.response = {
          status: 401,
          data: { errorCode: 'AUTHENTICATION_REQUIRED' },
        };
        throw err;
      }

      return {
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
        data: { initialListingId: 77, user: { id: 10, role: 'OWNER' } },
      };
    };

    refreshPostSpy.mockResolvedValueOnce({
      data: {
        accessToken: 'FRESH_MEMBER_TOKEN',
        user: { id: 10, email: 'member@example.com', role: 'MEMBER' },
      },
    });

    const refreshedSpy = vi.fn();
    registerSessionRefreshedHandler(refreshedSpy);

    const payload = { companyName: 'AdCo', billboard: { name: 'BKC LED' } };
    const res = await api.post('/api/onboarding/owner', payload);

    expect(res.status).toBe(201);
    expect(refreshPostSpy).toHaveBeenCalledTimes(1);
    expect(refreshedSpy).toHaveBeenCalledTimes(1);
    expect(seenRequests).toHaveLength(2);
    // First attempt carried the stale token; retry MUST carry the fresh token
    expect(seenRequests[0].authHeader).toBe('Bearer EXPIRED_MEMBER_TOKEN');
    expect(seenRequests[1].authHeader).toBe('Bearer FRESH_MEMBER_TOKEN');
    // Body MUST be single-encoded JSON, never double-stringified
    expect(typeof seenRequests[1].data).toBe('string');
    expect(JSON.parse(seenRequests[1].data)).toEqual(payload);
  });

  it('refreshes once on 401 for FormData multipart upload and replays with new bearer token and intact FormData', async () => {
    const seenRequests = [];

    api.defaults.adapter = async (config) => {
      const authHeader =
        typeof config.headers?.get === 'function'
          ? config.headers.get('Authorization')
          : config.headers?.Authorization;
      seenRequests.push({ authHeader, data: config.data });

      if (seenRequests.length === 1) {
        const err = new Error('Unauthorized');
        err.config = config;
        err.response = { status: 401, data: { errorCode: 'AUTHENTICATION_REQUIRED' } };
        throw err;
      }

      return { status: 200, statusText: 'OK', headers: {}, config, data: [{ id: 1 }] };
    };

    refreshPostSpy.mockResolvedValueOnce({
      data: {
        accessToken: 'FRESH_OWNER_TOKEN',
        user: { id: 10, email: 'member@example.com', role: 'OWNER' },
      },
    });

    const formData = new FormData();
    formData.append(
      'manifest',
      new Blob([JSON.stringify({ fileMappings: [] })], { type: 'application/json' }),
    );
    formData.append('files', new File(['img-bytes'], 'day1.jpg', { type: 'image/jpeg' }));

    const res = await api.post('/api/owner/listings/501/media/sync', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    expect(res.status).toBe(200);
    expect(refreshPostSpy).toHaveBeenCalledTimes(1);
    expect(seenRequests).toHaveLength(2);
    expect(seenRequests[1].authHeader).toBe('Bearer FRESH_OWNER_TOKEN');
    expect(seenRequests[1].data).toBeInstanceOf(FormData);
    expect(seenRequests[1].data.getAll('files')).toHaveLength(1);
  });

  it('refreshes on 401 for GET /api/auth/me when opted in via _allowRefresh, while skipping other /api/auth/* routes by default', async () => {
    let meCalls = 0;
    api.defaults.adapter = async (config) => {
      if (config.url === '/api/auth/me') {
        meCalls += 1;
        if (meCalls === 1) {
          const err = new Error('Unauthorized');
          err.config = config;
          err.response = { status: 401, data: { errorCode: 'AUTHENTICATION_REQUIRED' } };
          throw err;
        }
        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          data: { id: 10, role: 'MEMBER' },
        };
      }
      const err = new Error('Wrong OTP');
      err.config = config;
      err.response = { status: 401, data: { errorCode: 'INVALID_OTP' } };
      throw err;
    };

    refreshPostSpy.mockResolvedValueOnce({
      data: {
        accessToken: 'FRESH_TOKEN_ME',
        user: { id: 10, role: 'MEMBER' },
      },
    });

    // Any un-flagged /api/auth/* endpoint (e.g. future OTP verify) must NOT trigger refresh
    await expect(api.post('/api/auth/otp-verify', { code: '000000' })).rejects.toThrow();
    expect(refreshPostSpy).not.toHaveBeenCalled();

    // Explicitly opted-in /api/auth/me refreshes once and replays
    const res = await api.get('/api/auth/me', { _allowRefresh: true });
    expect(res.status).toBe(200);
    expect(refreshPostSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT clear authStorage, wipe draft, or fire onSessionExpired on transient 5xx or network refresh failures', async () => {
    saveOwnerRegisterDraft({ f_companyName: 'Preserve Me Co' }, 10);

    api.defaults.adapter = async (config) => {
      const err = new Error('Unauthorized');
      err.config = config;
      err.response = { status: 401, data: { errorCode: 'AUTHENTICATION_REQUIRED' } };
      throw err;
    };

    const expiredSpy = vi.fn();
    registerSessionExpiredHandler(expiredSpy);

    // 1. 503 Service Unavailable from /api/auth/refresh
    const transient503 = new Error('Service Unavailable');
    transient503.response = { status: 503, data: { errorCode: 'SERVICE_UNAVAILABLE' } };
    refreshPostSpy.mockRejectedValueOnce(transient503);

    await expect(api.post('/api/onboarding/owner', { companyName: 'Preserve Me Co' })).rejects.toBe(
      transient503,
    );
    expect(expiredSpy).not.toHaveBeenCalled();
    expect(authStorage.getAccessToken()).toBe('EXPIRED_MEMBER_TOKEN');
    expect(loadOwnerRegisterDraft(10)?.f_companyName).toBe('Preserve Me Co');

    // 2. Network error (no response object) from /api/auth/refresh
    const networkErr = new Error('Network Error');
    networkErr.code = 'ERR_NETWORK';
    refreshPostSpy.mockRejectedValueOnce(networkErr);

    await expect(api.post('/api/onboarding/owner', { companyName: 'Preserve Me Co' })).rejects.toBe(
      networkErr,
    );
    expect(expiredSpy).not.toHaveBeenCalled();
    expect(authStorage.getAccessToken()).toBe('EXPIRED_MEMBER_TOKEN');
    expect(loadOwnerRegisterDraft(10)?.f_companyName).toBe('Preserve Me Co');
  });

  it('does NOT attempt refresh or fire onSessionExpired for an anonymous visitor with no prior session', async () => {
    authStorage.clear();
    const expiredSpy = vi.fn();
    registerSessionExpiredHandler(expiredSpy);

    api.defaults.adapter = async (config) => {
      const err = new Error('Unauthorized');
      err.config = config;
      err.response = { status: 401, data: { errorCode: 'AUTHENTICATION_REQUIRED' } };
      throw err;
    };

    await expect(api.get('/api/auth/me', { _allowRefresh: true })).rejects.toThrow();
    expect(refreshPostSpy).not.toHaveBeenCalled();
    expect(expiredSpy).not.toHaveBeenCalled();
  });

  it('shares a single in-flight refresh across concurrent 401 requests', async () => {
    const attemptsByUrl = {};
    api.defaults.adapter = async (config) => {
      attemptsByUrl[config.url] = (attemptsByUrl[config.url] || 0) + 1;
      if (attemptsByUrl[config.url] === 1) {
        const err = new Error('Unauthorized');
        err.config = config;
        err.response = { status: 401, data: { errorCode: 'AUTHENTICATION_REQUIRED' } };
        throw err;
      }
      const authHeader =
        typeof config.headers?.get === 'function'
          ? config.headers.get('Authorization')
          : config.headers?.Authorization;
      return { status: 200, statusText: 'OK', headers: {}, config, data: { authHeader } };
    };

    refreshPostSpy.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: {
                  accessToken: 'SHARED_FRESH_TOKEN',
                  user: { id: 10, role: 'OWNER' },
                },
              }),
            20,
          ),
        ),
    );

    const [r1, r2] = await Promise.all([
      api.get('/api/owner/listings'),
      api.get('/api/notifications'),
    ]);

    expect(refreshPostSpy).toHaveBeenCalledTimes(1);
    expect(r1.data.authHeader).toBe('Bearer SHARED_FRESH_TOKEN');
    expect(r2.data.authHeader).toBe('Bearer SHARED_FRESH_TOKEN');
  });

  it('never refreshes on _skipRefresh or credential endpoints, and never loops on a second 401', async () => {
    api.defaults.adapter = async (config) => {
      const err = new Error('Unauthorized');
      err.config = config;
      err.response = { status: 401, data: { errorCode: 'INVALID_CREDENTIALS' } };
      throw err;
    };

    await expect(
      api.post('/api/auth/login', { email: 'a@b.com', password: 'bad' }),
    ).rejects.toThrow();
    await expect(
      api.post('/api/custom/otp', { code: '000000' }, { _skipRefresh: true }),
    ).rejects.toThrow();
    expect(refreshPostSpy).not.toHaveBeenCalled();

    // Protected route returning 401 even after refresh must reject without looping
    refreshPostSpy.mockResolvedValueOnce({
      data: { accessToken: 'STILL_REJECTED', user: { id: 10, role: 'MEMBER' } },
    });
    await expect(api.post('/api/onboarding/owner', { companyName: 'X' })).rejects.toThrow();
    expect(refreshPostSpy).toHaveBeenCalledTimes(1);
  });

  it('fires onSessionExpired exactly once on concurrent refresh failures, clears draft PII, and tags sentinel error', async () => {
    saveOwnerRegisterDraft({ f_companyName: 'Secret Corp', f_gst: '27AAAAA0000A1Z5' }, 10);
    expect(loadOwnerRegisterDraft(10)).not.toBeNull();

    api.defaults.adapter = async (config) => {
      const err = new Error('Unauthorized');
      err.config = config;
      err.response = { status: 401, data: { errorCode: 'AUTHENTICATION_REQUIRED' } };
      throw err;
    };

    refreshPostSpy.mockImplementationOnce(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => {
            const err = new Error('Refresh expired');
            err.response = { status: 401, data: { errorCode: 'TOKEN_EXPIRED' } };
            reject(err);
          }, 15),
        ),
    );

    const expiredSpy = vi.fn();
    registerSessionExpiredHandler(expiredSpy);

    const results = await Promise.allSettled([
      api.post('/api/onboarding/owner', { companyName: 'X' }),
      api.get('/api/auth/me', { _allowRefresh: true }),
    ]);

    expect(results[0].status).toBe('rejected');
    expect(results[0].reason.code).toBe('SESSION_EXPIRED');
    expect(results[0].reason.isSessionExpired).toBe(true);
    expect(expiredSpy).toHaveBeenCalledTimes(1);
    expect(expiredSpy).toHaveBeenCalledWith({ reason: 'SESSION_EXPIRED' });
    expect(authStorage.getAccessToken()).toBeNull();
    expect(loadOwnerRegisterDraft(10)).toBeNull();
  });

  it('passes ACCOUNT_DISABLED reason when refresh rejects due to disabled account, and skips refresh on SESSION_INVALID', async () => {
    const expiredSpy = vi.fn();
    registerSessionExpiredHandler(expiredSpy);

    // 1. Refresh returns ACCOUNT_DISABLED
    api.defaults.adapter = async (config) => {
      const err = new Error('Unauthorized');
      err.config = config;
      err.response = { status: 401, data: { errorCode: 'AUTHENTICATION_REQUIRED' } };
      throw err;
    };
    const disabledErr = new Error('Disabled');
    disabledErr.response = { status: 401, data: { errorCode: 'ACCOUNT_DISABLED' } };
    refreshPostSpy.mockRejectedValueOnce(disabledErr);

    await expect(api.post('/api/onboarding/owner', {})).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
      sessionReason: 'ACCOUNT_DISABLED',
    });
    expect(expiredSpy).toHaveBeenCalledWith({ reason: 'ACCOUNT_DISABLED' });

    // 2. Direct 401 SESSION_INVALID skips /api/auth/refresh completely
    resetSessionExpiryGuard();
    expiredSpy.mockClear();
    refreshPostSpy.mockClear();
    authStorage.setSession({ accessToken: 'DELETED_USER_TOKEN', user: { id: 99, role: 'MEMBER' } });

    api.defaults.adapter = async (config) => {
      const err = new Error('Deleted');
      err.config = config;
      err.response = { status: 401, data: { errorCode: 'SESSION_INVALID' } };
      throw err;
    };

    await expect(api.post('/api/onboarding/owner', {})).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
      sessionReason: 'SESSION_INVALID',
    });
    expect(refreshPostSpy).not.toHaveBeenCalled();
    expect(expiredSpy).toHaveBeenCalledTimes(1);
    expect(expiredSpy).toHaveBeenCalledWith({ reason: 'SESSION_INVALID' });
  });
});
