import { App, Plugin } from 'vue';
import waku from './plugins/vue-waku';
import WakuChat from './components/WakuChat.vue';
import { ChatComponentOptions } from './types/ChatTypes';

export default {
    install: (app: App, options?: ChatComponentOptions) => {
        app.use(waku, options);
        app.component('ChatComponent', WakuChat);
    },
} as Plugin;