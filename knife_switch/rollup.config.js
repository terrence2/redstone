import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from 'rollup-plugin-replace'
import { eslint } from 'rollup-plugin-eslint'
import { uglify } from 'rollup-plugin-uglify'
import filesize from 'rollup-plugin-filesize'
import sizes from 'rollup-plugin-sizes'

// Uncomment this to use regenerator-runtime
// This crashes Espruino for some reason...
const USE_REGEN = false;

let uglify_opts = {
  compress: {
    passes: 2,
    hoist_funs: true,
    hoist_vars: true,
    //toplevel: true,
  },
}

if (process.env.NODE_ENV === 'production') {
  uglify_opts.mangle = {
    toplevel: true,
    /*properties: {
      reserved: ['on', 'catch', 'next', 'reslove', 'reject']
    },*/
  }
} else {
  uglify_opts.compress.drop_debugger = false;
  uglify_opts.output = {
    beautify: true,
  }
}

export default {
  input: 'src/main.js',
  output: {
    file:   'dist/bundle.js',
    format: 'es',
  },
  plugins: [
    eslint({throwOnError: true,}),
    commonjs({ignore: ['Wifi', 'ws']}),
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    babel({
      exclude: 'node_modules/**',
      runtimeHelpers: false,
      presets: [
        [
          "@babel/preset-env",
          {
            "targets": {"esmodules": false},
            "modules": false
          }
        ]
      ],
      plugins: []
    }),
    replace({
      ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      ENGINE: 'espruino',
    }),
    //uglify(uglify_opts),
    sizes({details: true}),
    filesize(),
  ],
}
