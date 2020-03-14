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

/**
 * A state object for communication with the webthings runtime.
 * 
 * Note: subclassing does not work in espruino, so this class is
 *       intended to be used directly. Users will generally want to
 *       call createProperty before passing the state to WebThing.
 */
class WebThingState {
  constructor() {
    this._properties = {};
    this._property_watchers = {};
  }

  create_property({
    name,
    type,
    initial_value,
    title,
    description,
    read_only = true,
    enumerants = null
  }) {
    this._properties[name] = {
      value: initial_value,
      title: title,
      type: type,
      readOnly: read_only,
      description: description
    };
    if (enumerants != null) {
      this._properties[name]['enum'] = enumerants;
    }
  }

  get_properties() {
    return this._properties;
  }

  get_property_names() {
    let a = [];
    for (let propname in this._properties) {
      a.push(propname);
    }
    return a;
  }

  property_is_read_only(name) {
    return this._properties[name].readOnly || false;
  }

  get_property(name) {
    return this._properties[name].value;
  }

  set_property(name, value) {
    this._properties[name].value = value;
    for (let watch_name in this._property_watchers) {
      const watch_func = this._property_watchers[watch_name];
      watch_func(name, value);
    }
  }

  set_property_link(name, href) {
    this._properties[name]['links'] = [{'rel': 'property', 'href': href}];
  }

  watch_properties(watch_name, watch_func) {
    this._property_watchers[watch_name] = watch_func;
  }

  unwatch_properties(watch_name) {
    delete this._property_watchers[watch_name];
  }
}

module.exports = WebThingState;