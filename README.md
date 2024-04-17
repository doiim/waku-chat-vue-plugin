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
        cssConfig: {
          colors: {
            header: {
              main: 'rgba(219, 234, 254, 1)',
              text: 'rgba(107, 114, 128, 1)',
              btn: 'rgba(37, 99, 235, 1)',
              btnHover: 'rgba(30, 64, 175, 1)',
            },
            room: {
              btn: {
                text: 'rgba(37, 99, 235, 1)',
                textHover: 'rgba(30, 64, 175, 1)',
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
              textHover: 'rgba(30, 64, 175, 1)',
              editName: {
                main: 'rgba(229, 231, 235, 1)',
                placeholder: 'rgba(156, 163, 175, 1)',
                text: 'rgba(31, 41, 55, 1)',
                disabled: 'rgba(229, 231, 235, 1)',
              }
            },
            loadBtn: {
              main: 'rgba(37, 99, 235, 1)',
              hover: 'rgba(30, 64, 175, 1)',
              text: 'rgba(249, 250, 251, 1)',
              textHover: 'rgba(249, 250, 251, 1)',
            },
            loadingBtn: {
              main: 'rgba(37, 99, 235, 1)',
              text: 'rgba(249, 250, 251, 1)',
            },
            openBtn: {
              main: 'rgba(37, 99, 235, 1)',
              hover: 'rgba(30, 64, 175, 1)',
              text: 'rgba(249, 250, 251, 1)',
              textHover: 'rgba(249, 250, 251, 1)',
            },
            sendBtn: {
              main: 'rgba(37, 99, 235, 1)',
              hover: 'rgba(30, 64, 175, 1)',
              text: 'rgba(249, 250, 251, 1)',
              textHover: 'rgba(249, 250, 251, 1)',
              disabled: 'rgba(75, 85, 99, 1)',
            },
            input: {
              main: 'rgba(229, 231, 235, 1)',
              placeholder: 'rgba(156, 163, 175, 1)',
              text: 'rgba(31, 41, 55, 1)',
              disabled: 'rgba(229, 231, 235, 1)',
            },
            minimizeBtn: {
              main: 'rgba(107, 114, 128, 1)',
              hover: 'rgba(30, 64, 175, 1)',
            },
            chat: {
              myMessage: {
                main: 'rgba(37, 99, 235, 1)',
                user: 'rgba(37, 99, 235, 1)',
                text: 'rgba(249, 250, 251, 1)',
              },
              otherMessage: {
                main: 'rgba(229, 231, 235, 1)',
                user: 'rgba(156, 163, 175, 1)',
                text: 'rgba(31, 41, 55, 1)',
              },
              timestamp: 'rgba(156, 163, 175, 1)',
            },
            background: 'rgba(249, 250, 251, 1)',
            border: 'rgba(37, 99, 235, 1)',
          },
          shadows: {
            openedComponent: 0.1
          },
          border: {
            size: '1px'
          },
        },
      })
      .mount("#app");
    ```

### Configuration Options

Here are the available configuration options:

- `wakuChannelName`: (string) - The name that will be used to create your message's topic on Waku.
- `availableRooms`: (string[]) - Rooms available on your chat to separate messages.
- `wakuPeers`: (string[]) (optional) - Waku peers to connect by default. If you don't set this, Waku will use automatic peers. Use this to set your own peers.
- `disconnectDelay`: (number) - Time in milisseconds which chat can be minimized before being disconnected. 5 minutes if not set.
- `groupMessagesTime`: (number) - Time in milisseconds which messages from the same sender can be grouped. 1 minute if not set.
- `messagesToDownload`: (number) - Max number of messages to retrieve when user connects to chat. Default no limit.
- `messageAgeToDownload`: (number) - Max age of messages in milisseconds which messages would be downloaded when user connects to chat. Default 24h.
- `changeNickMode`: ('application' | 'user') (optional) - 'application' allows your app to change nicknames via a dispatch event, 'interface' allows users to directly change their nicknames and allows the same method as 'application'. Any other value won't allow change nicknames.

  If you set 'application' or 'user', in your code you can call:

  ```js
  document.dispatchEvent(
    new CustomEvent("changeNickName", { detail: "_newNickNameHere" })
  );
  ```

  To change user’s nickname.

  TIP: If you change id during the application run (because of login or logout) and you want your names derived of the id, you need to notice that the user name will persist, so you need to reset it:

  ```js
  document.dispatchEvent(new CustomEvent('changeNickName', { detail: '' }));
  ```

  So, when you change the id, a new name will be generated, or you can set another name on the message and no need to generate another.

- `cssConfig`:(Object) (optional) - Allow you to change css. ALl of them are optional, if you don’t set any of them, a default value will be applied. They are:
  - colors:(Object) - Allow you to change colors of components.
    - header: (Object) - Allow you to change colors from header.
      - main: (string) - main color.
      - text: (string) - text color
      - btn: (string) - buttons color
      - btnHover: (string) - buttons hover color.
    - room: (Object) - Allow you to change colors from room components.
      - btn: (Object) - Allow you to change colors from room button.
        - text: (string) - text color.
        - textHover: (string) - text hover color.
      - dropdown: (Object) - Allow you to change colors from room dropdown.
        - main: (string) - main color.
        - text: (string) - text color.
        - hover: (string) - hover option color.
        - selected: (string) - selected option color.
    - subHeader: (Object) - Allow you to change colors from sub header.
      - main: (string) - main color.
      - text: (string) - text color.
      - textHover: (string) - text hover color.
      - editName - Change color for change name input
          - main - main color
          - placeholder - placeholder text color
          - text - text color
          - disabled - disabled color
    - loadBtn: (Object) - Allow you to change colors from load button.
      - main: (string) - main color.
      - hover: (string) - hover color.
      - text: (string) - text color.
      - textHover: (string) - text hover color.
    - loadingBtn: (Object) - Allow you to change colors from loading spinner.
      - main: (string) - main color.
      - text: (string) - text color.
    - openBtn: (Object) - Allow you to change colors from open button.
      - main: (string) - main color.
      - hover: (string) - hover color.
      - text: (string) - text color.
      - textHover: (string) - text hover color.
    - sendBtn: (Object) - Allow you to change colors from send button.
      - main: (string) - main color.
      - hover: (string) - hover color.
      - text: (string) - text color.
      - textHover: (string) - text hover color.
      - disabled: (string) - disabled color.
    - input: (Object) - Allow you to change colors from message input.
      - main: (string) - main color.
      - placeholder: (string) - placeholder text color.
      - text: (string) - text color.
      - disabled: (string) - disabled background color.
    - minimizeBtn: (Object) - Allow you to change colors from minimize button.
      - main: (string) - main color.
      - hover: (string) - hover button color.
    - chat: (Object) - Allow you to change colors from chat content.
      - myMessage: (Object) - Allow you to change colors from use messages.
        - main: (string) - main color.
        - user: (string) - user name color.
        - text: (string) - text color.
      - otherMessage: (Object) - Allow you to change colors from others messages.
        - main: (string) - main color.
        - user: (string) - user name color.
        - text: (string) - text color.
      - timestamp: (string) - timestamp text color.
    - background: (string) - Allow you to change background color.
    - border: (string) - Allow you to change border color.
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
