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
'use strict';

class EffectSystem {
  constructor(leds) {
    // The underlying led driver.
    this.leds = leds;

    // The program to run and color argument.
    this.effect = 'solid';
    this.color = [0, 255, 0];

    // Internal state
    this.time_offset = 0;
    this.prior_color = null;

    // Start the frame driver.
    setInterval(this.driver.bind(this), 16);
  }

  set_color(value) {
    this.color = value;
  }

  set_effect(value) {
    const EFFECTS = {
      'dim': true,
      'flame': true,
      'solid': true,
      'swirl': true,
      'wave': true
    };
    if (EFFECTS[value] != true) {
      console.log('unknown effect driver: ' + value);
      return;
    }
    this.effect = value;
  }

  driver() {
    this['run_' + this.effect + '_driver'].call(this);
    this.time_offset += 16;
    this.time_offset %= 16000000;
  }

  run_solid_driver() {
    if (this.prior_color === this.color) {
      return;
    }
    this.prior_color = this.color;

    this.leds.fill_color(this.color);
    this.leds.refresh();
  }

  run_dim_driver() {
    if (this.prior_color === this.color) {
      return;
    }
    this.prior_color = this.color;

    this.leds.fill_color([0, 0, 0]);
    this.leds.set_pixel_color(0, this.color);
    this.leds.refresh();
  }

  run_swirl_driver() {
    const INTERVAL = 6000;
    let time_offset = this.time_offset;
    let h = (time_offset % INTERVAL) / INTERVAL;
    let [r, g, b] = E.HSBtoRGB(h, 1, 0.5, true);
    function mkpix(period) {
      let w = time_offset * 3.14 / 180 * period;
      return [
        b + (b / 2) * Math.sin(w),
        g + (g / 2) * Math.sin(w),
        r + (r / 2) * Math.sin(w)
      ];
    }
    this.leds.set_pixel_color(0, mkpix(1/3));
    this.leds.set_pixel_color(1, mkpix(1/9));
    this.leds.set_pixel_color(2, mkpix(1/7));
    this.leds.set_pixel_color(3, mkpix(1/11));
    this.leds.refresh();
  }

  run_flame_driver() {
    let time_offset = this.time_offset;
    function mkpix(period, amplitude, r, g, b) {
      let w = time_offset * 3.14 / 180;
      let wind_effect = (1 + Math.sin(w / 7)) / 2 * (1 + Math.sin(w / 5)) / 2;
      let flicker = wind_effect * Math.random();
      return [
        r + (r * amplitude + flicker * 5) * Math.sin(w * period + flicker),
        g + (g * amplitude + flicker * 5) * Math.sin(w * period + flicker),
        b + (b * amplitude + flicker * 5) * Math.sin(w * period + flicker)
      ];
    }
    this.leds.set_pixel_color(0, mkpix(1 / 2, 1 / 8, 128, 64, 0));
    this.leds.set_pixel_color(1, mkpix(1 / 3, 1 / 6, 192, 32, 0));
    this.leds.set_pixel_color(2, mkpix(1 / 7, 1 / 2, 96, 96, 32));
    this.leds.set_pixel_color(3, mkpix(1 / 5, 1 / 4, 128, 64, 0));
    this.leds.refresh();
  }

  run_wave_driver(state) {
    let time_offset = this.time_offset;
    let [r, g, b] = this.color;
    function mkpix(period) {
      let w = time_offset * 3.14 / 180 * period;
      return [
        r + (r / 2) * Math.sin(w),
        g + (g / 2) * Math.sin(w),
        b + (b / 2) * Math.sin(w)
      ];
    }
    this.leds.set_pixel_color(0, mkpix(1 / 3));
    this.leds.set_pixel_color(1, mkpix(1 / 9));
    this.leds.set_pixel_color(2, mkpix(1 / 7));
    this.leds.set_pixel_color(3, mkpix(1 / 11));
    this.leds.refresh();
  }
}

module.exports = EffectSystem;