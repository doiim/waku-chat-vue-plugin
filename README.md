<p align="center">
    <img src="https://github.com/doiim/waku-chat-vue-plugin/blob/main/assets/logos.png" alt="Doiim + Waku Logo">
</p>

# Waku Chat Vue Plugin

This document describes a plugin made with Waku and Vue, that implements a simple chat.

[Live Demo!](https://doiim.github.io/waku-chat-vue/)

## Usage

Follow these steps to install and use the package in your project:

1.  Install the package in your project's folder:

    ```sh
    $ npm install @doiim/waku-chat-vue-plugin
    ```

2.  In your `main.js` file, import the component and pass it to the `use` function. Passing on the options field
    the app name and rooms available on your chat.

        ```js
        import { createApp } from 'vue'
        import App from './App.vue'
        import WakuChatVuePlugin from '@doiim/waku-chat-vue-plugin';

        createApp(App).use(WakuChatVuePlugin,
        {
            wakuChannelName: 'my-app-name',
            availableRooms: ['General', 'Off'],
        }).mount('#app');
        ```

3.  You can also set other configuration options:

    ```js
    import { createApp } from "vue";
    import App from "./App.vue";
    import WakuChatVuePlugin from "@doiim/waku-chat-vue-plugin";

    createApp(App)
      .use(WakuChatVuePlugin, {
        wakuChannelName: "my-app-name",
        availableRooms: ["General", "Off"],
        wakuPeers: ["your/waku/peer/string/address/here"],
        changeNickMode: "message",
        styleConfig: {
          colors: {
            light:{
              primary:"rgba(41, 79, 204, 1)",
              secondary:"rgba(8, 45, 166, 1)",
              tertiary:"rgba(182, 201, 242, 1)",
              quaternary:"rgba(217, 229, 255, 1)"
            },
            dark: {
              primary:"rgba(214, 227, 255, 1)",
              secondary:"rgba(168, 191, 240, 1)",
              tertiary:"rgba(26, 73, 229, 1)",
              quaternary:"rgba(18, 51, 161, 1)"
            },
          },
          shadows: {
            openedComponent: 0.1,
            messageBalloon: 0.1
          },
          border: {
            size: '1px'
          }
        },
      })
      .mount("#app");
    ```

4. Instantiate the componente inside your template.

    ```js
      <WakuChatVuePlugin :externalUserId="externalId" :externalUserName="externalName" 
      :onOpen="externalOnOpen" :onClose="externalOnClose"
      :onConnect="externalOnConnect" :onDisconnect="externalOnDisconnect" />
    ```

  The configurations available are:
  
- `externalUserId`: (string) - The user id for identification of message owners
- `externalUserName`: (string) (optional) - The user name for displaying on messages, after sending a message cannot be changed on that message. If not provided, the user name will be generated using the id.
- `onOpen`: (() => void) (optional) - A function called everytime user opens the chat window.
- `onClose`: (() => void) (optional) - A function called everytime user closes the chat window.
- `onConnect`: (() => void) (optional) - A function called when chat connects from peers.
- `onDisconnect`: (() => void) (optional) - A function called when chat disconnects from peers, usually when chat is closed and 'disconnectDelay' time passes.

### Configuration Options

Here are the available configuration options:

- `wakuChannelName`: (string) - The name that will be used to create your message's topic on Waku.
- `availableRooms`: (string[]) - Rooms available on your chat to separate messages.
- `wakuPeers`: (string[]) (optional) - Waku peers to connect by default. If you don't set this, Waku will use automatic peers. Use this to set your own peers.
- `disconnectDelay`: (number) (optional) - Time in milisseconds which chat can be minimized before being disconnected. 5 minutes if not set.
- `groupMessagesTime`: (number) (optional) - Time in milisseconds which messages from the same sender can be grouped. 1 minute if not set.
- `messagesToDownload`: (number) (optional) - Max number of messages to retrieve when user connects to chat. Default 100 messages.
- `messageAgeToDownload`: (number) (optional) - Max age of messages in milisseconds which messages would be downloaded when user connects to chat. Default not considering age of messages.
- `showSystemMessages`: (boolean) (optional) - Show or not system messages. Default not show.
- `userChangeNick`: (boolean) (optional) - Allow users to change their nicknames.
- `theme`: ('light' | 'dark') (optional) - Choose a theme, it will affect colors. if none is chosen light it will be chosen
- `styleConfig`:(Object) (optional) - Allow you to change css. ALl of them are optional, if you don’t set any of them, a default value will be applied. They are:
  - colors:(Object) - Allow you to change colors of components.
    - light: (Object) - Allow you to change colors of light theme.
      - primary: (string) - main color. If not set it will be blue [rgba(41, 79, 204, 1)]
      - secondary: (string) - second color. If not set it will derive from primary color.
      - tertiary: (string) - third color. If not set it will derive from primary color.
      - quaternary: (string) - forth color. If not set it will derive from primary color.
    - dark: (Object) - Allow you to change colors of dark theme.
      - primary: (string) - main color. If not set it will derive from light primary color.
      - secondary: (string) - second color. If not set it will derive from primary color.
      - tertiary: (string) - third color. If not set it will derive from primary color.
      - quaternary: (string) - forth color. If not set it will derive from primary color.
  - shadows: allow you change shadows from component
    - openedComponent: (number) - shadow from the hole chat
    - messageBalloon: (number) - shadow from the message balloon
  - border: allow you change borders from component
    - size: (string) - border size (specify your unit) of the chat component

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
