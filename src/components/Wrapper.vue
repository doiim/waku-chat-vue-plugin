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
        </head>
        <body>
            <WakuChat :externalUserId="props.externalUserId" />
        </body>
    </shadow-root>
</template>