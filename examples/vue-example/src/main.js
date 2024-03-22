import { createApp } from 'vue'
import App from './App.vue'
import ChatComponent from 'waku-chat-vue-plugin';

createApp(App).use(ChatComponent, {
    wakuChannelName: 'my-app-name',
    wakuPeers: [],
    availableRooms: ['General', 'Off'],
    changeNickMode: 'message',
    allowPrivateChat: false,
    cssConfig: {
        primaryColor: 'rgba(29, 78, 216, 1)',
        primaryColorHover: 'rgba(29, 78, 180, 1)',
        primaryTextColor: 'rgba(255, 255, 255, 1)',
        secondaryColor: 'rgba(229, 231, 235, 1)',
        secondaryColorHover: 'rgba(229, 231, 235, 0.7)',
        secondaryTextColor: 'rgba(0, 0, 0, 1)',
        backgroundColor: 'rgba(0, 0, 0, 0.01)',
        myMessageColor: 'rgba(29, 78, 216, 1)',
        myMessageTextColor: 'rgba(255, 255, 255, 1)',
        otherMessageColor: 'rgba(136, 153, 166, 0.3)',
        otherMessageTextColor: 'rgba(29, 78, 216, 1)',
    }
}).mount('#app');