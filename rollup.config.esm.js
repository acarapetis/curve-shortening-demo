import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import {terser} from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript';

export default {
    input: 'src/csf.ts',
	output: {
        file: 'build/bundle.min.mjs',
		format: 'esm',
	},
	onwarn(warning) {
		console.error(`(!) ${warning.message}`);
	},
	plugins: [
		resolve({
		  jsnext: true,
		  main: true,
		}),
        commonjs(),
        typescript(),
        babel( {
            "presets": [[
                "@babel/preset-env", {
                    "targets": { "esmodules": true }
                }
            ]]
        }),
		terser({
			warnings: true,
			mangle: {
				module: true,
			},
		}),
	]
}
