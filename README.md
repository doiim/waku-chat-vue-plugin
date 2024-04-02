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
            colors: {
                header: {
                    main: 'rgba(219, 234, 254, 1)',
                    text: 'rgba(107, 114, 128, 1)',
                    textHover: 'rgba(37, 99, 235, 1)',
                },
                room: {
                    btn: {
                        text: 'rgba(31, 41, 55, 1)',
                        textHover: 'rgba(37, 99, 235, 1)',
                    },
                    dropdown: {
                        main: 'rgba(255, 255, 255, 1)',
                        text: 'rgba(31, 41, 55, 1)',
                        hover: 'rgba(243, 244, 246, 1)',
                        selected: 'rgba(29, 78, 216, 1)'
                    }
                },
                subHeader: {
                    main: 'rgba(239, 246, 255, 1)',
                    text: 'rgba(37, 99, 235, 1)',
                    textHover: 'rgba(37, 99, 235, 1)',
                },
                loadBtn: {
                    main: 'rgba(37, 99, 235, 1)',
                    hover: 'rgba(59, 130, 246,1)',
                    text: 'rgba(249, 250, 251, 1)',
                    textHover: 'rgba(37, 99, 235, 1)',
                },
                loadingBtn: {
                    main: 'rgba(37, 99, 235, 1)',
                    text: 'rgba(249, 250, 251, 1)',
                },
                openBtn: {
                    main: 'rgba(37, 99, 235, 1)',
                    hover: 'rgba(59, 130, 246,1)',
                    text: 'rgba(249, 250, 251, 1)',
                    textHover: 'rgba(37, 99, 235, 1)',
                },
                sendBtn: {
                    main: 'rgba(37, 99, 235, 1)',
                    hover: 'rgba(59, 130, 246,1)',
                    text: 'rgba(249, 250, 251, 1)',
                    textHover: 'rgba(37, 99, 235, 1)',
                },
                input: {
                    main: 'rgba(229, 231, 235, 1)',
                    placeholder: 'rgba(156, 163, 175, 1)',
                    text: 'rgba(31, 41, 55, 1)'
                },
                minimizeBtn: {
                    main: 'rgba(107, 114, 128, 1)',
                    hover: 'rgba(37, 99, 235, 1)',
                },
                chat: {
                    myMessage: {
                        main: 'rgba(37, 99, 235, 1)',
                        text: 'rgba(249, 250, 251, 1)',
                    },
                    otherMessage: {
                        main: 'rgba(229, 231, 235, 1)',
                        text: 'rgba(31, 41, 55, 1)',
                    },
                    timestamp: 'rgba(156, 163, 175, 1)',
                },
                background: 'rgba(249, 250, 251, 1)',
                border: 'rgba(37, 99, 235, 1)',
            }
        }
    }
    ).mount('#app');
    ```

### Configuration Options

Here are the available configuration options:

- `wakuChannelName`: (string) - The name that will be used to create your message's topic on Waku.
- `availableRooms`: (string[]) - Rooms available on your chat to separate messages.
- `wakuPeers`: (string[]) (optional) - Waku peers to connect by default. If you don't set this, Waku will use automatic peers. Use this to set your own peers.
- `changeNickMode`: ('application' | 'user') (optional) - 'application' allows your app to change nicknames via a dispatch event, 'interface' allows users to directly change their nicknames and allows the same method as 'application'. Any other value won't allow change nicknames.

    If you set 'application' or 'user', in your code you can call:
    ```js
    document.dispatchEvent(new CustomEvent('changeNickName', { detail: '_newNickNameHere' }));

    ```
    To change user’s nickname.

- `cssConfig`:(Object) (optional) - Allow you to change css. ALl of them are optional, if you don’t set any of them, a default value will be applied. They are:
    * colors:(Object)  - Allow you to change colors of components.
        * header: (Object)  - Allow you to change colors from header.
            * main: (string)  - main color.
            * text: (string)  -  text color
            * textHover: (string)  - text hover color.
        * room: (Object)  - Allow you to change colors from room components.  
            * btn: (Object)  - Allow you to change colors from room button.  
                * text: (string)  - text color.  
                * textHover: (string)  - text hover color.
            * dropdown: (Object)  - Allow you to change colors from room dropdown.   
                * main: (string)  - main color.   
                * text: (string)  - text color.  
                * hover: (string)  - hover option color.  
                * selected: (string)  - selected option color.  
        * subHeader: (Object)  - Allow you to change colors from sub header.  
            * main: (string)  - main color.  
            * text: (string)  - text color.  
            * textHover: (string)  - text hover color.  
        * loadBtn: (Object)  - Allow you to change colors from load button. 
            * main: (string)  - main color.  
            * hover: (string)  - hover color.  
            * text: (string)  - text color.  
            * textHover: (string)  - text hover color.  
        * loadingBtn: (Object)  - Allow you to change colors from loading spinner.  
            * main: (string)  - main color.  
            * text: (string)  - text color.  
        * openBtn: (Object)  - Allow you to change colors from open button.  
            * main: (string)  - main color.  
            * hover: (string)  - hover color.  
            * text: (string)  - text color.  
            * textHover: (string)  - text hover color.  
        * sendBtn: (Object)  - Allow you to change colors from send button.  
            * main: (string)  - main color.  
            * hover: (string)  - hover color.  
            * text: (string)  - text color.  
            * textHover: (string)  - text hover color.  
            * disabled: (string)  - disabled color.  
        * input: (Object)  - Allow you to change colors from message input.  
            * main: (string)  - main color.  
            * placeholder: (string)  - placeholder text color. 
            * text: (string)  - text color.  
            * disabled: (string)  - disabled background color.  
        * minimizeBtn: (Object)  - Allow you to change colors from minimize button.
            * main: (string)  - main color.  
            * hover: (string)  - hover button color. 
        * chat: (Object)  - Allow you to change colors from chat content.  
            * myMessage: (Object)  - Allow you to change colors from use messages.  
                * main: (string)  - main color.  
                * text: (string)  - text color.  
            * otherMessage: (Object)  - Allow you to change colors from others messages.  
                * main: (string)  - main color.  
                * text: (string)  - text color.  
            * timestamp: (string)  - timestamp text color.  
        * background: (string)  - Allow you to change background color.   
        * border: (string)  - Allow you to change border color.   

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