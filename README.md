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
        hideClose: false,
        styleConfig: {
          colors: {
            light: {
              primary: "rgba(41, 79, 204, 1)",
              secondary: "rgba(8, 45, 166, 1)",
              tertiary: "rgba(182, 201, 242, 1)",
              quaternary: "rgba(217, 229, 255, 1)",
            },
            dark: {
              primary: "rgba(214, 227, 255, 1)",
              secondary: "rgba(168, 191, 240, 1)",
              tertiary: "rgba(26, 73, 229, 1)",
              quaternary: "rgba(18, 51, 161, 1)",
            },
          },
          shadows: {
            openedComponent: 0.1,
            messageBalloon: 0.1,
          },
          border: {
            size: "1px",
          },
        },
      })
      .mount("#app");
    ```

4.  Instantiate the componente inside your template.

    ```js
      <WakuChatVuePlugin :externalUserId="externalId" :externalUserName="externalName" :externalUserType="externalType"
      :onOpen="externalOnOpen" :onClose="externalOnClose"
      :onConnect="externalOnConnect" :onDisconnect="externalOnDisconnect" :theme="dark"/>
    ```

The configurations available are:

- `externalUserId`: (string) - The user id for identification of message owners
- `externalUserName`: (string) (optional) - The user name for displaying on messages, after sending a message cannot be changed on that message. If not provided, the user name will be generated using the id.
- `externalUserType`: (string) (optional) - The user type for displaying on messages, after sending a message cannot be changed on that message.
- `onOpen`: (() => void) (optional) - A function called everytime user opens the chat window.
- `onClose`: (() => void) (optional) - A function called everytime user closes the chat window.
- `onConnect`: (() => void) (optional) - A function called when chat connects from peers.
- `onDisconnect`: (() => void) (optional) - A function called when chat disconnects from peers, usually when chat is closed and 'disconnectDelay' time passes.
- `theme`: ('light' | 'dark') (optional) - Choose a theme, it will affect colors. if none is chosen light it will be chosen
- `chatPos`: (Object) (optional) - Choose the chat position, default is {bottom:'16px',right:'16px'}. You can use any css unit (px, %, etc)
  - `top`: (string) (optional) - Choose top position or let it undefined if you want to set bottom
  - `left`: (string) (optional) - Choose left position or let it undefined if you want to set right
  - `bottom`: (string) (optional) - Choose bottom position or let it undefined if you want to set top
  - `right`: (string) (optional) - Choose right position or let it undefined if you want to set left
- `balloonPos`: (Object) (optional) - Choose ballon buttons position, default is {bottom:'36px',right:'34px'}. You can use any css unit (px, %, etc)
  - `top`: (string) (optional) - Choose top position or let it undefined if you want to set bottom
  - `left`: (string) (optional) - Choose left position or let it undefined if you want to set right
  - `bottom`: (string) (optional) - Choose bottom position or let it undefined if you want to set top
  - `right`: (string) (optional) - Choose right position or let it undefined if you want to set left
- `animationDirection`: ('up' | 'down' | 'left' | 'right') (optional) - Define open/close animation direction
- `chatSize`: (Object) (optional) - Choose chat size, default is {width:'360px',height:'576px'}. You can use any css unit (px, %, calc(), etc)
  - `width`: (string) (optional) - Choose width size or let it undefined for '360px'
  - `height`: (string) (optional) - Choose heigth size or let it undefined for '576px'

5.  Define process global variable.

Because of some updates on current nwaku-sdk version, you need to define globally the variable process on your application:
On vite this can be made with:

    ```js
      import { defineConfig } from "vite";
      import vue from "@vitejs/plugin-vue";
      export default defineConfig({
        plugins: [vue()],
        base: "/waku-chat-vue/",
        define: { process: "window.process" }
      });
    ```

### Configuration Options

Here are the available configuration options:

- `wakuChannelName`: (string) - The name that will be used to create your message's topic on Waku.
- `availableRooms`: (string[]) - Rooms available on your chat to separate messages.
- `wakuPeers`: (string[]) (optional) - Waku peers to connect by default. If you don't set this, Waku will use automatic peers. Use this to set your own peers.
- `disconnectDelay`: (number) (optional) - Time in milisseconds which chat can be minimized before being disconnected. 5 minutes if not set.
- `groupMessagesTime`: (number) (optional) - Time in milisseconds which messages from the same sender can be grouped. 1 minute if not set.
- `messageAgeToDownload`: (number) (optional) - Max age of messages in milisseconds which messages would be downloaded when user connects to chat. Default not considering age of messages.
- `fetchMsgsOnScroll`: (boolean) (optional) (Default = true) - Enable/disable loading messages when scrolling up in chat history. When enabled, messages are loaded in batches as user scrolls. When disabled, messages are loaded based on messageAgeToDownload.
- `fetchMaxAttempts`: (number) (optional) (Default = 3) - Maximum number of consecutive attempts to fetch messages when receiving low/no responses. After exceeding this limit, fetching pauses temporarily.
- `fetchTotalLimit`: (number) (optional) (Default 0 or null) - Maximum total number of messages to load when fetchMsgsOnScroll is enabled. Set to 0 for unlimited history. This limit is not applied when fetchMsgsOnScroll is disabled.
  - if `fetchMsgsOnScroll` is true: (default 0 - unlimited)
  - if `fetchMsgsOnScroll` is false: (default null - not applicable)
- `fetchLimit`: (number) (optional) (Default 10 or 100)- Controls the number of messages retrieved in each fetch operation:
  - if `fetchMsgsOnScroll` is true: (default 10)
  - if `fetchMsgsOnScroll` is false: (default 100)
- `showSystemMessages`: (boolean) (optional) - Show or not system messages. Default not show.
- `userChangeNick`: (boolean) (optional) - Allow users to change their nicknames.
- `hideClose`: (boolean) (optional) - Hides the close button from chat, default is false.
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

### Exposed Events
- `connectChat`: (() => void) - Connects to the chat while in background and fetchs the initial messages.
- `openChat`: (() => void) - Opens the chat container.
- `closeChat`: (() => void) - Closes the chat container.


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

```

```
