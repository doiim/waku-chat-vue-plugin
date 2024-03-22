# Waku Chat Component

This document describes the Waku Chat component.

[Live Demo!](https://doiim.github.io/waku-chat-vue-plugin/examples/vue-example/)

## Usage

### Vue

Follow these steps to install and use the package in your project:

1. Install the package in your project's folder:

    ```sh
    $ npm install waku-chat-vue-plugin 
    ```

2. In your `main.js` file, import the component and pass it to the `use` function. You can also set configuration options:

    ```js
    import { createApp } from 'vue'
    import App from './App.vue'
    import ChatComponent from 'waku-chat-vue-plugin';

    createApp(App).use(ChatComponent, {
        wakuChannelName: 'my-app-name',
        wakuPeers: [],
        availableRooms: ['General', 'Off'],
        changeNickMode: 'message',
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
    ```

### Configuration Options

Here are the available configuration options:

- `wakuChannelName`: (string) The name that will be used to create your message's topic on Waku.
- `wakuPeers`: (string[]) Waku peers to connect by default. If you don't set this, Waku will use automatic peers. Use this to set your own peers.
- `availableRooms`: (string[]) Rooms available on your chat to separate messages. Default value is ['General','Support','Off-Topic']
- `changeNickMode`: ('message' | 'interface') 'message' allows your app to change nicknames via a dispatch event, 'interface' allows users to directly change their nicknames and allows the same method as 'message'. Any other value won't allow change nicknames.

    If you set 'message' or 'interface', in your code you can call:
    ```js
    document.dispatchEvent(new CustomEvent('changeNickName', { detail: '_newNickNameHere' }));

    ```
    To change user’s nickname.

- `cssConfig`: (Object) Allow you to change css colors. If you don’t set any of them, a default value will be applied. They are:
    * primaryColor
    * primaryColorHover
    * primaryTextColor
    * secondaryColor
    * secondaryColorHover
    * secondaryTextColor
    * backgroundColor
    * myMessageColor
    * myMessageTextColor
    * otherMessageColor
    * otherMessageTextColorDoiim

## Examples
You can find examples in the [examples](https://github.com/doiim/waku-chat-vue-plugin/tree/main/examples) folder.

## Building the Plugin
To build the plugin, first clone this repo, install dependencies in the project root, and build the project:

    ```sh
    $ git clone https://github.com/doiim/waku-chat-vue-plugin.git
    $ cd waku-chat-vue-plugin
    $ npm install
    $ npm run build
    ```

This will generate the compiled project in the dist folder.

![Waku Logo](https://github.com/doiim/waku-chat-vue-plugin/assets/waku.png)

![Doiim Logo](https://github.com/doiim/waku-chat-vue-plugin/assets/doiim.png)

## References

- [Waku](https://github.com/waku-org/awesome-waku)
- [VueJS](https://vuejs.org/)
- [Other Doiim projects](https://github.com/doiim)