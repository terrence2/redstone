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
const bhs_matcher = /bhs\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;
const rgb_matcher = /rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;

function parse_html_color(color) {
  if (color == 'none') {
    return [0x00, 0x00, 0x00];
  }
  let parts = color.match(bhs_matcher);
  if (parts !== null) {
    let b = parseInt(parts[1]) / 255;
    let h = parseInt(parts[2]) * (360 / 65536);
    let s = parseInt(parts[3]) / 255;
    return hsv_to_rgb(h, s, b);
  }
  parts = color.match(rgb_matcher);
  if (parts !== null) {
    let r = parseInt(parts[1]);
    let g = parseInt(parts[2]);
    let b = parseInt(parts[3]);
    return [r, g, b];
  }
  return [0x50, 0x00, 0x50];
}

// 0 <= h < 360
// 0 <= s < 1
// 0 <= l < 1
function hsl_to_rgb(h, s, l) {
  // Looks like there's a builtin?!?
  // E.HSBtoRGB(1, 0, 1, true)

  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));

  let rgb = [0, 0, 0];
  if (h < 60) {
    rgb = [c, x, 0];
  } else if (h < 120) {
    rgb = [x, c, 0];
  } else if (h < 180) {
    rgb = [0, c, x];
  } else if (h < 240) {
    rgb = [0, x, c];
  } else if (h < 300) {
    rgb = [x, 0, c];
  } else {
    rgb = [c, 0, x];
  }

  let m = (l - c / 2);
  return [
    Math.round((rgb[0] + m) * 255),
    Math.round((rgb[1] + m) * 255),
    Math.round((rgb[2] + m) * 255)
  ];
}

// 0 <= h < 360
// 0 <= s < 1
// 0 <= v < 1
function hsv_to_rgb(h, s, v) {
  let c = v * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));

  let rgb = [0, 0, 0];
  if (h < 60) {
    rgb = [c, x, 0];
  } else if (h < 120) {
    rgb = [x, c, 0];
  } else if (h < 180) {
    rgb = [0, c, x];
  } else if (h < 240) {
    rgb = [0, x, c];
  } else if (h < 300) {
    rgb = [x, 0, c];
  } else {
    rgb = [c, 0, x];
  }

  let m = v - c;
  return [
    Math.round((rgb[0] + m) * 255),
    Math.round((rgb[1] + m) * 255),
    Math.round((rgb[2] + m) * 255)
  ];
}

module.exports = {
  parse_html: parse_html_color,
  hsl_to_rgb: hsl_to_rgb,
  hsv_to_rgb: hsv_to_rgb
};