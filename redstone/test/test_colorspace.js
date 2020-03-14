let assert = require('assert');
let colorspace = require('../src/colorspace.js');

describe('Colorspace', function() {
  describe('parse', function() {
    it('should parse none to off', function() {
      assert.deepEqual(colorspace.parse_html('none'), [0, 0, 0]);
    });
    it('should parse rgb', function() {
      assert.deepEqual(colorspace.parse_html('rgb(0,0,0)'), [0, 0, 0]);
      assert.deepEqual(colorspace.parse_html('rgb(255,255,255)'), [0xff, 0xff, 0xff]);
      assert.deepEqual(colorspace.parse_html('rgb(1,1,1)'), [1, 1, 1]);
      assert.deepEqual(colorspace.parse_html('rgb (1,1,1)'), [1, 1, 1]);
      assert.deepEqual(colorspace.parse_html('rgb( 1,1,1)'), [1, 1, 1]);
      assert.deepEqual(colorspace.parse_html('rgb(1 ,1,1)'), [1, 1, 1]);
      assert.deepEqual(colorspace.parse_html('rgb(1, 1,1)'), [1, 1, 1]);
      assert.deepEqual(colorspace.parse_html('rgb(1,1 ,1)'), [1, 1, 1]);
      assert.deepEqual(colorspace.parse_html('rgb(1,1, 1)'), [1, 1, 1]);
      assert.deepEqual(colorspace.parse_html('rgb(1,1,1 )'), [1, 1, 1]);
      assert.deepEqual(colorspace.parse_html('rgb(1,1,1) '), [1, 1, 1]);
    });
    it('should parse bhs', function() {
      assert.deepEqual(colorspace.parse_html('bhs(0,0,0)'), [0, 0, 0]);
      assert.deepEqual(colorspace.parse_html('bhs(0,65535,255)'), [0, 0, 0]);
      assert.deepEqual(colorspace.parse_html('bhs(255,0,0)'), [0xff, 0xff, 0xff]);
      assert.deepEqual(colorspace.parse_html('bhs(255,32768,0)'), [0xff, 0xff, 0xff]);
      assert.deepEqual(colorspace.parse_html('bhs(255,0,255)'), [0xff, 0x0, 0x0]);
      assert.deepEqual(colorspace.parse_html('bhs(255,65535,255)'), [0xff, 0x0, 0x0]);
      assert.deepEqual(colorspace.parse_html('bhs(255,32768,255)'), [0x0, 0xff, 0xff]);
    });
  });
});
