<script setup lang="ts">
import { defineProps, onMounted, ref } from "vue";
import WakuChat from "./WakuChat.vue";

const wakuChatRef = ref<typeof WakuChat | null>(null);

const props = defineProps<{
  externalUserId?: string;
  externalUserName?: string;
  externalUserType?: string;
  onOpen?: () => void;
  onClose?: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  theme?: string;
  balloonPos?: {
    top?: string;
    left?: string;
    bottom?: string;
    right?: string;
  };
  chatPos?: {
    top?: string;
    left: string;
    bottom?: string;
    right?: string;
  };
  animationDirection?: string;
  chatSize?: {
    width?: string;
    height?: string;
  };
}>();

const pluginHead = ref<HTMLHeadElement | null>(null);

const openChat = () => {
  if (wakuChatRef.value) {
    wakuChatRef.value.openChat();
  }
};

const closeChat = () => {
  if (wakuChatRef.value) {
    wakuChatRef.value.closeChat();
  }
};

defineExpose({ openChat, closeChat });

onMounted(() => {
  const style = document.createElement("style");
  style.textContent = "MY_STYLE_CONTENT";
  style.type = "text/css";
  if (pluginHead.value) pluginHead.value.appendChild(style);
});
</script>

<template>
  <shadow-root>
    <head ref="pluginHead">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin="true"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap"
        rel="stylesheet"
      />
    </head>

    <body>
      <WakuChat
        ref="wakuChatRef"
        :externalUserId="props.externalUserId"
        :externalUserName="props.externalUserName"
        :externalUserType="props.externalUserType"
        :onConnect="props.onConnect"
        :onDisconnect="props.onDisconnect"
        :onOpen="props.onOpen"
        :onClose="props.onClose"
        :theme="props.theme"
        :balloonPos="props.balloonPos"
        :chatPos="props.chatPos"
        :animationDirection="props.animationDirection"
        :chatSize="props.chatSize"
      />
    </body>
  </shadow-root>
</template>
