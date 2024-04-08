import { App, Plugin } from 'vue';
import waku from './plugins/vue-waku';
import WakuChat from './components/Wrapper.vue';
import Shadow from 'vue-shadow-dom'
import { WakuChatVuePluginOptions } from './types/ChatTypes';

export default {
    install: (app: App, options?: WakuChatVuePluginOptions) => {
        app.use(waku, options);
        app.use(Shadow)
        app.component('WakuChatVuePlugin', WakuChat);
    },
} as Plugin;