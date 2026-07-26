import { parseObjectRouteParam } from '../routeParams';

describe('parseObjectRouteParam', () => {
  it('parses an object from a route parameter', () => {
    expect(parseObjectRouteParam<{ barcode: string }>('{"barcode":"613"}')).toEqual({
      barcode: '613',
    });
  });

  it.each(['{', 'null', '[]', '"text"', '', undefined])(
    'rejects malformed or non-object input: %p',
    (value) => {
      expect(parseObjectRouteParam(value)).toBeNull();
    },
  );

  it('accepts the first value when Expo supplies an array', () => {
    expect(parseObjectRouteParam(['{"id":1}', '{"id":2}'])).toEqual({ id: 1 });
  });
});
