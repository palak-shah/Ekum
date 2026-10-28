import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/apiClient';
import {
  PUBLISH_MANDATORY_FIELDS_MESSAGE,
  bulkPublishSettled,
  publishMandatoryFieldsMessage,
} from './publishMandatoryFieldsMessage';

function err(code: string, message: string) {
  return new ApiError({ statusCode: 400, code, message });
}

describe('publishMandatoryFieldsMessage', () => {
  it('maps missing name, category, and empty pack to trader copy', () => {
    expect(publishMandatoryFieldsMessage([err('INVALID_NAME', 'Give this collection a name.')])).toBe(
      PUBLISH_MANDATORY_FIELDS_MESSAGE,
    );
    expect(
      publishMandatoryFieldsMessage([err('CATEGORY_REQUIRED', 'Choose a category to publish.')]),
    ).toBe(PUBLISH_MANDATORY_FIELDS_MESSAGE);
    expect(
      publishMandatoryFieldsMessage([err('COLLECTION_EMPTY', 'Add at least one design.')]),
    ).toBe(PUBLISH_MANDATORY_FIELDS_MESSAGE);
    expect(
      publishMandatoryFieldsMessage([
        err('INVALID_NAME', 'Give this collection a name.'),
        err('CATEGORY_REQUIRED', 'Choose a category to publish.'),
      ]),
    ).toBe(PUBLISH_MANDATORY_FIELDS_MESSAGE);
  });

  it('keeps the server line for relist and other errors', () => {
    expect(
      publishMandatoryFieldsMessage([
        err('RELIST_REQUIRED', 'Ask Ekum to relist this collection.'),
      ]),
    ).toBe('Ask Ekum to relist this collection.');
    expect(
      publishMandatoryFieldsMessage([
        err('CATEGORY_REQUIRED', 'Choose a category to publish.'),
        err('RELIST_REQUIRED', 'Ask Ekum to relist this collection.'),
      ]),
    ).toBe('Choose a category to publish.');
  });
});

describe('bulkPublishSettled', () => {
  it('collects rejected reasons', () => {
    const fail = err('CATEGORY_REQUIRED', 'Choose a category to publish.');
    const outcome = bulkPublishSettled([
      { status: 'fulfilled', value: {} },
      { status: 'rejected', reason: fail },
    ]);
    expect(outcome).toEqual({ ok: 1, failed: 1, reasons: [fail] });
  });
});
