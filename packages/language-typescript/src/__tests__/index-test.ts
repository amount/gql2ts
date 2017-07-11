import {
  interfaceExtendListToString,
  DEFAULT_NAME_QUERY,
  DEFAULT_FORMAT_INPUT,
  DEFAULT_TYPE_PRINTER
} from '../';

describe('language-typescript', () => {
  describe('interfaceExtendListToString', () => {
    it('with non-empty array', () => {
      expect(
        interfaceExtendListToString(['test', 'test2', 'test3'])
      ).toMatchSnapshot();
    });
    it('with empty array', () => {
      expect(interfaceExtendListToString([])).toMatchSnapshot();
    });
  });

  describe('DEFAULT_NAME_QUERY', () => {
    it('anonymous', () => {
      expect(DEFAULT_NAME_QUERY({} as any)).toMatchSnapshot();
    });
    it('with name', () => {
      expect(
        DEFAULT_NAME_QUERY({ name: { value: 'test' } } as any)
      ).toMatchSnapshot();
    });
  });

  describe('DEFAULT_FORMAT_INPUT', () => {
    it('non optional', () => {
      expect(DEFAULT_FORMAT_INPUT('test', false, 'test2')).toMatchSnapshot();
    });
    it('optional', () => {
      expect(DEFAULT_FORMAT_INPUT('test', true, 'test2')).toMatchSnapshot();
    });
  });

  describe('DEFAULT_TYPE_PRINTER', () => {
    it('non null', () => {
      expect(DEFAULT_TYPE_PRINTER('test', false)).toMatchSnapshot();
    });
    it('null', () => {
      expect(DEFAULT_TYPE_PRINTER('test', true)).toMatchSnapshot();
    });
  });
});
