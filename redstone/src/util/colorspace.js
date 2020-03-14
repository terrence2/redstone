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
    return E.HSBtoRGB(h / 360, s, b, true);
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

module.exports = {
  parse_html: parse_html_color,
};