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
import config from './config.js';
let espruino = require('../src/hardware/espruino_wifi.js');
let colorspace = require('../src/util/colorspace.js');
let webthing = require('../src/webthing.js');

// LED rings
SPI1.setup({mosi:A7, sck:A5});
SPI2.setup({mosi:B15, sck:B10});

// Buttons
pinMode(A0, 'input_pullup');
pinMode(A1, 'input_pullup');
pinMode(B9, 'input_pullup');
pinMode(B8, 'input_pullup');

const PIN_MAP = {
  A0: 0,
  A1: 1,
  B9: 2,
  B8: 3
};

class State {
  constructor() {
    this.properties = {
      most_recent_button_press: {
        value: 0,
        title: 'MostRecentButtonPress',
        type: 'integer',
        readOnly: true,
        description: 'The most recently pressed button'
      },
      color: {
        value: 'none',
        title: 'Color',
        type: 'string',
        readOnly: false,
        description: 'The color to set the LEDs'
      },
      effect: {
        value: 'solid',
        title: 'EffectStyle',
        type: 'string',
        enum: ['solid'],
        readOnly: false,
        description: 'The effect style with which to drive the LEDs'
      }
    };
    this.property_watchers = {};
  }

  get_property(name) {
    return this.properties[name].value;
  }

  set_property(name, value) {
    this.properties[name].value = value;
    for (let key in this.property_watchers) {
      const watch_func = this.property_watchers[key];
      watch_func(name, value);
    }
  }

  watch_properties(watch_name, watch_func) {
    this.property_watchers[watch_name] = watch_func;
  }

  unwatch_properties(watch_name) {
    delete this.property_watchers[watch_name];
  }
}
let state = new State();
console.log('initial most_recent_button_press: ' + state.get_property('most_recent_button_press'));

function onButtonPress(pin) {
  let next_state = PIN_MAP[pin];
  if (next_state == state.get_property('most_recent_button_press')) {
    return;
  }
  state.set_property('most_recent_button_press', next_state);

  console.log('new state: ' + next_state);

  // FIXME: emit events too
}

setInterval(function() {
  let effect = state.get_property('effect');
  if (effect === 'solid') {
    set_solid_color_interval();
  }
}, 16);

const HEADER = [0x00, 0x00, 0x00, 0x00];
const FOOTER = [0xFF, 0xFF, 0xFF, 0xFF];
let prior_color = '';
function set_solid_color_interval() {
  let color = state.get_property('color');
  if (prior_color === color) {
    return;
  }
  prior_color = color;

  let [r, g, b] = colorspace.parse_html(color);
  let pix = [0xff, b, g, r];

  let buffer = HEADER.concat(pix, pix, pix, pix, FOOTER);
  console.log('DATA: ' + buffer);
  SPI1.write(buffer);
}

espruino.connect_to_wifi(config.wifi, function() {
  let opts = { repeat: true };
  let watchablePins = [A0, A1, B9, B8];
  for (const pin of watchablePins) {
    setWatch(function(_state, _time, _lastTime) { onButtonPress(pin); }, pin, opts);
  }

  let thing = webthing.start(config.thing, state);
});
