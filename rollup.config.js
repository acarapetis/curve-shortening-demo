import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript';

// Rollup config for minified production builds

const config = (output, babelConf) => ({
    input: 'build/csf.js',
    output,
    onwarn(warning) {
        console.error(`(!) ${warning.message}`);
    },
    plugins: [
        typescript(),
        resolve(),
        commonjs(),
        babel(babelConf),
        terser({
            warnings: true,
            mangle: {
                module: true,
            },
        }),
    ]
})

export default [
    config({
        file: 'build/bundle.min.js',
        format: 'iife',
    },{
        presets: [
            ['@babel/preset-env', {
                useBuiltIns: 'usage',
                corejs: 3,
                targets: '> 1%',
                modules: false,
            }],
        ],
        exclude: [/\/core-js\//],
    }),
    config({
        file: 'build/bundle.min.mjs',
        format: 'esm',
    },{
        presets: [[
            "@babel/preset-env", {
                targets: { esmodules: true }
            }
        ]]
    })
]
