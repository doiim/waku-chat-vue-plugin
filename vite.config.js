import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [
        vue(),
        dts({ include: ['src'] })
    ],
    css: {
        modules: { scopeBehaviour: 'global', },
    },
    input: 'src/index.ts',
    base: '/waku-chat-vue-plugin/',
    resolve: {
        preserveSymlinks: true,
    },
    build: {
        lib: {
            entry: resolve(__dirname, './src/index.ts'),
            name: 'WakuChatVuePlugin',
            fileName: 'waku-chat-vue-plugin',
        },
        rollupOptions: {
            external: ['vue','protobufjs','@waku/sdk','@libp2p/bootstrap'],
            output: {
                globals: {
                    vue: 'Vue',
                    protobufjs:'protobufjs',
                    '@waku/sdk':'@waku/sdk',
                    '@libp2p/bootstrap':'@libp2p/bootstrap'
                },
            },
        },
    },
})