// This file is part of Redstone.
//
// Redstone is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Redstone is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Redstone.  If not, see <http://www.gnu.org/licenses/>.

const HEADER = [0x00, 0x00, 0x00, 0x00];
const FOOTER = [0xFF, 0xFF, 0xFF, 0xFF];

class DotStar {
  constructor(spi, pinmap, led_count) {
    spi.setup(pinmap);
    this.spi = spi;
    this.led_count = led_count;
    this.buffer_length = 8 + 4 * led_count;
    this.buffer = new Uint8ClampedArray(this.buffer_length);
    // Copy in header.
    for (let i = 0; i < 4; ++i) {
      this.buffer[i] = HEADER[i];
    }
    // Set all refresh bytes up front and don't touch them again.
    for (let pix = 0; pix < this.led_count; ++pix) {
      this.buffer[4 + 4 * pix] = 0xff;
    }
    // Copy in footer.
    for (let i = 0; i < 4; ++i) {
      this.buffer[this.buffer_length - i - 1] = FOOTER[i];
    }
  }

  fill_color(color) {
    for (let pix = 0; pix < this.led_count; ++pix) {
      this.set_pixel_color(pix, color);
    }
  }

  set_pixel_color(pix, color) {
    if (pix >= this.led_count) {
      return;
    }
    this.buffer[4 + 4 * pix + 1] = color[2];
    this.buffer[4 + 4 * pix + 2] = color[1];
    this.buffer[4 + 4 * pix + 3] = color[0];
  }

  /**
   * Send current color state to device.
   */
  refresh() {
    this.spi.write(this.buffer);
  }
}

module.exports = DotStar;