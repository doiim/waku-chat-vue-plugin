<script setup lang="ts">
import { ref, onMounted, defineProps } from "vue";
import WakuChat from "./WakuChat.vue"
const props = defineProps<{
    externalUserId: string | undefined;
}>()

const shadowRootHeadRef = ref<HTMLElement | null>(null);

onMounted(() => {
    setTimeout(async () => {
        const styleElements = document.head.querySelectorAll('style');
        styleElements.forEach(link => {
            const dataViteDevId = link.getAttribute('data-vite-dev-id');
            if (dataViteDevId?.endsWith('waku-chat-vue-plugin/dist/index.css')) {

                if (shadowRootHeadRef.value) {
                    shadowRootHeadRef.value.appendChild(link.cloneNode(true));
                    link.remove();
                }
            }
        });
    }, 0);
});
</script>

<template>
    <shadow-root>

        <head ref="shadowRootHeadRef">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link
                href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap"
                rel="stylesheet">
        </head>

        <body>
            <WakuChat :externalUserId="props.externalUserId" />
        </body>
    </shadow-root>
</template>