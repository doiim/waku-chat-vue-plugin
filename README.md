<p align="center">
    <img src="https://github.com/doiim/waku-chat-vue-plugin/blob/main/assets/logos.png" alt="Doiim + Waku Logo">
</p>

# Waku Chat Vue Plugin

This document describes a plugin made with Waku and Vue, that implements a simple chat.

[Live Demo!](https://doiim.github.io/waku-chat-vue/)

## Usage

Follow these steps to install and use the package in your project:

1. Install the package in your project's folder:

    ```sh
    $ npm install waku-chat-vue-plugin 
    ```

2. In your `main.js` file, import the component and pass it to the `use` function. Passing on the options field
the app name and rooms available on your chat.

    ```js
    import { createApp } from 'vue'
    import App from './App.vue'
    import WakuChatVuePlugin from 'waku-chat-vue-plugin';

    createApp(App).use(WakuChatVuePlugin,
    {
        wakuChannelName: 'my-app-name',
        availableRooms: ['General', 'Off'],
    }).mount('#app');
    ```

3.  You can also set other configuration options:

    ```js
    import { createApp } from 'vue'
    import App from './App.vue'
    import WakuChatVuePlugin from 'waku-chat-vue-plugin';

    createApp(App).use(WakuChatVuePlugin,
    {
        wakuChannelName: 'my-app-name',
        availableRooms: ['General', 'Off'],
        wakuPeers: ['your/waku/peer/string/address/here'],
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
    }
    ).mount('#app');
    ```

### Configuration Options

Here are the available configuration options:

- `wakuChannelName`: (string) - The name that will be used to create your message's topic on Waku.
- `availableRooms`: (string[]) - Rooms available on your chat to separate messages.
- `wakuPeers`: (string[]) (optional) - Waku peers to connect by default. If you don't set this, Waku will use automatic peers. Use this to set your own peers.
- `changeNickMode`: ('message' | 'interface') (optional) - 'message' allows your app to change nicknames via a dispatch event, 'interface' allows users to directly change their nicknames and allows the same method as 'message'. Any other value won't allow change nicknames.

    If you set 'message' or 'interface', in your code you can call:
    ```js
    document.dispatchEvent(new CustomEvent('changeNickName', { detail: '_newNickNameHere' }));

    ```
    To change user’s nickname.

- `cssConfig`: (Object) (optional) - Allow you to change css colors. If you don’t set any of them, a default value will be applied. They are:
    * primaryColor: (string)(optional) - primary color in a string format
    * primaryColorHover: (string)(optional) - primary color hover in a string format
    * primaryTextColor: (string)(optional) - primary text color in a string format
    * secondaryColor: (string)(optional) - secondary color in a string format
    * secondaryColorHover: (string)(optional) - secondary color hover in a string format
    * secondaryTextColor: (string)(optional) - secondary text color in a string format
    * backgroundColor: (string)(optional) - background color in a string format
    * myMessageColor: (string)(optional) - color for my messages in a string format
    * myMessageTextColor: (string)(optional) - text color for my messages in a string format
    * otherMessageColor: (string)(optional) - color for others messagesin a string format
    * otherMessageTextColor: (string)(optional) - text color for others messagesin a string format

## Examples
You can find a vue example [here](https://github.com/doiim/waku-chat-vue).

## Building the Plugin
To build the plugin, first clone this repo, install dependencies in the project root, and build the project:

    ```sh
    $ git clone https://github.com/doiim/waku-chat-vue-plugin.git
    $ cd waku-chat-vue-plugin
    $ npm install
    $ npm run build
    ```

This will generate the compiled project in the dist folder.

## References

- [Waku](https://github.com/waku-org/awesome-waku)
- [VueJS](https://vuejs.org/)
- [Other Doiim projects](https://github.com/doiim)