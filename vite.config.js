import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import fs from 'fs'


export default defineConfig({
    plugins: [
        vue(),
        dts({
            include: ['src'], outputDir: 'dist', afterBuild: (files) => {
                const srcPath = resolve(__dirname, 'dist/src/index.d.ts')
                const destPath = resolve(__dirname, 'dist/waku-chat-vue-plugin.d.ts')
                fs.renameSync(srcPath, destPath)
            }
        })
    ],
    css: {
        modules: { scopeBehaviour: 'global', },
    },
    build: {
        lib: {
            entry: resolve(__dirname, './src/index.ts'),
            name: 'WakuChatVuePlugin',
            fileName: 'waku-chat-vue-plugin',
        },
        rollupOptions: {
            external: ['vue', 'protobufjs', '@waku/sdk', '@libp2p/bootstrap'],
            output: {
                globals: {
                    vue: 'Vue',
                    protobufjs: 'protobufjs',
                    '@waku/sdk': '@waku/sdk',
                    '@libp2p/bootstrap': '@libp2p/bootstrap'
                },
            },
        },
    },
})