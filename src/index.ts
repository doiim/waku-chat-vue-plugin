import { App, Plugin } from 'vue';
import waku from './plugins/vue-waku';
import WakuChat from './components/WakuChat.vue';
import { WakuChatVuePluginOptions } from './types/ChatTypes';

export default {
    install: (app: App, options?: WakuChatVuePluginOptions) => {
        app.use(waku, options);
        app.component('WakuChatVuePlugin', WakuChat);
    },
} as Plugin;