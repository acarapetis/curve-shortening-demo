import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import {terser} from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript';

export default {
    input: 'src/csf.ts',
	output: {
        file: 'build/bundle.mjs',
		format: 'esm',
        //sourcemap: 'inline',
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
	]
}
