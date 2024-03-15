import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { libInjectCss } from 'vite-plugin-lib-inject-css'

export default defineConfig({
    plugins: [
        vue(),
        libInjectCss(),
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
            name: 'ChatComponent',
            fileName: 'waku-chat-vue-plugin',
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue',
                },
            },
        },
    },
})