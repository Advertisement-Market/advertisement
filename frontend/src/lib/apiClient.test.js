import { describe, it, expect } from 'vitest';
import { apiErrorMessage } from './apiClient';

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
