import { describe, expect, it, beforeEach } from 'vitest';
import {
  catalogShareSenderLabel,
  orderViewerIsFacilitator,
  readRememberedFacilitator,
  resolveFacilitatorForCatalog,
  resolveForwardFacilitator,
  resolveOrderPathForCatalog,
  withFacilitatorQuery,
  withOrderPathQuery,
  catalogOrderGoesToLine,
  rememberCatalogHandlerName,
  readCatalogHandlerName,
} from './forwardAttribution';

describe('resolveForwardFacilitator', () => {
  it('returns sender when distinct from viewer and owner', () => {
    expect(
      resolveForwardFacilitator({
        senderCompanyId: 'trader',
        viewerCompanyId: 'buyer',
        ownerCompanyId: 'supplier',
      }),
    ).toBe('trader');
  });

  it('skips own shares and owner shares', () => {
    expect(
      resolveForwardFacilitator({
        senderCompanyId: 'buyer',
        viewerCompanyId: 'buyer',
        ownerCompanyId: 'supplier',
      }),
    ).toBeUndefined();
    expect(
      resolveForwardFacilitator({
        senderCompanyId: 'supplier',
        viewerCompanyId: 'buyer',
        ownerCompanyId: 'supplier',
      }),
    ).toBeUndefined();
  });
});

describe('withFacilitatorQuery', () => {
  it('appends query', () => {
    expect(withFacilitatorQuery('/collections/c1', 'trader')).toBe(
      '/collections/c1?facilitator=trader',
    );
  });
});

describe('order path query', () => {
  beforeEach(() => sessionStorage.clear());

  it('appends path', () => {
    expect(withOrderPathQuery('/collections/c1', 'handle')).toBe('/collections/c1?path=handle');
  });

  it('sticky after query', () => {
    expect(
      resolveOrderPathForCatalog({
        catalogKind: 'collection',
        catalogId: 'c1',
        queryPath: 'handle',
      }),
    ).toBe('handle');
    expect(
      resolveOrderPathForCatalog({
        catalogKind: 'collection',
        catalogId: 'c1',
        queryPath: null,
      }),
    ).toBe('handle');
  });
});

describe('catalogOrderGoesToLine', () => {
  it('names the sharer on I handle, the mill on Direct', () => {
    expect(
      catalogOrderGoesToLine({
        path: 'handle',
        ownerName: 'Ahmedabad Loom Co',
        handlerName: 'Ravi Textiles',
      }),
    ).toBe('Order goes to Ravi Textiles');
    expect(
      catalogOrderGoesToLine({
        path: 'direct',
        ownerName: 'Ahmedabad Loom Co',
        handlerName: 'Ravi Textiles',
      }),
    ).toBe('Order goes to Ahmedabad Loom Co');
    expect(
      catalogOrderGoesToLine({
        path: 'handle',
        ownerName: 'Ahmedabad Loom Co',
        handlerName: 'You',
        mine: true,
      }),
    ).toBe('Order goes to you');
  });
});

describe('handler name memory', () => {
  beforeEach(() => sessionStorage.clear());

  it('sticky remembers sharer name', () => {
    rememberCatalogHandlerName('collection', 'c1', 'Ravi Textiles');
    expect(readCatalogHandlerName('collection', 'c1')).toBe('Ravi Textiles');
  });
});

describe('catalogShareSenderLabel', () => {
  it('marks forwards', () => {
    expect(
      catalogShareSenderLabel({
        mine: false,
        senderLabel: 'Ravi',
        ownerCompanyId: 'ahmedabad',
        senderCompanyId: 'ravi',
      }),
    ).toBe('Ravi forwarded');
    expect(
      catalogShareSenderLabel({
        mine: true,
        senderLabel: 'You',
        ownerCompanyId: 'ahmedabad',
        senderCompanyId: 'ravi',
      }),
    ).toBe('You forwarded');
  });

  it('keeps plain name for own catalog share', () => {
    expect(
      catalogShareSenderLabel({
        mine: false,
        senderLabel: 'Ravi',
        ownerCompanyId: 'ravi',
        senderCompanyId: 'ravi',
      }),
    ).toBe('Ravi');
  });
});

describe('facilitator memory', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('sticky remembers after query', () => {
    expect(
      resolveFacilitatorForCatalog({
        catalogKind: 'collection',
        catalogId: 'c1',
        queryFacilitator: 'trader',
      }),
    ).toBe('trader');
    expect(readRememberedFacilitator('collection', 'c1')).toBe('trader');
    expect(
      resolveFacilitatorForCatalog({
        catalogKind: 'collection',
        catalogId: 'c1',
        queryFacilitator: null,
      }),
    ).toBe('trader');
  });

  it('orderViewerIsFacilitator', () => {
    expect(
      orderViewerIsFacilitator(
        {
          buyerCompanyId: 'b',
          sellerCompanyId: 's',
          facilitatorCompanyId: 't',
        },
        't',
      ),
    ).toBe(true);
    expect(
      orderViewerIsFacilitator(
        {
          buyerCompanyId: 'b',
          sellerCompanyId: 's',
          facilitatorCompanyId: 't',
        },
        's',
      ),
    ).toBe(false);
  });
});
