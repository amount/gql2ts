const { DEFAULT_BUILD_ROOT_INTERFACE_NAME } = require('../packages/language-typescript');
const expect = require('chai').expect;

describe('defaults', () => {
  describe('build root interface name', () => {
    it ('throws on unsupported definition', () => {
      expect(() => DEFAULT_BUILD_ROOT_INTERFACE_NAME({ kind: 'Fake' })).to.throw('Unsupported Definition Fake');
    })
  })
})
