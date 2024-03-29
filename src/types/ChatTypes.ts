export type Message = {
    id: string;
    author: Participant;
    type: string;
    timestamp: number;
    liked: boolean;
    data: { text?: string; emoji?: string };
    room: string;
};

export type Participant = { id: string, name: string }

export interface WakuChatVuePluginOptions {
    wakuChannelName: string,
    wakuPeers?: string[],
    availableRooms: string[],
    changeNickMode: 'message' | 'interface' | 'none',
    allowPrivateChat: boolean,
    cssConfig?: WakuChatConfigCss
}

export interface WakuChatConfigCss {
    colors: {
        header: {
            main: string,
            text: string,
            textHover: string,
        },
        room: {
            btn: {
                text: string,
                textHover: string,
            },
            dropdown: {
                main: string,
                text: string,
                hover: string,
                selected: string,
            }
        },
        subHeader: {
            main: string,
            text: string,
            textHover: string,
        },
        loadBtn: {
            main: string,
            hover: string,
            text: string,
            textHover: string,
        },
        loadingBtn: {
            main: string,
            text: string,
        },
        openBtn: {
            main: string,
            hover: string,
            text: string,
            textHover: string,
        },
        sendBtn: {
            main: string,
            hover: string,
            text: string,
            textHover: string,
        },
        input: {
            main: string,
            placeholder: string,
            text: string,
        },
        minimizeBtn: {
            main: string,
            hover: string,
        },
        chat: {
            myMessage: {
                main: string,
                text: string,
            },
            otherMessage: {
                main: string,
                text: string,
            },
            timestamp: string,
        },
        background: string,
        border: string,
    }
}
