import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [
        vue(),
    ],
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
                intro: `require ('./style.css')`,
                globals: {
                    vue: 'Vue',
                },
            },
        },
    },
})