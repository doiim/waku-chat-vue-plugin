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
    changeNickMode: 'application' | 'user' | 'none',
    allowPrivateChat: boolean,
    cssConfig?: WakuChatConfigCss,
    showSettings?: boolean
}

export interface WakuChatConfigCss {
    colors: {
        header: {
            main: string,
            text: string,
            btn: string,
            btnHover: string,
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
            editName: {
                main: string,
                placeholder: string,
                text: string,
                disabled: string,
            }
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
            disabled: string,
        },
        input: {
            main: string,
            placeholder: string,
            text: string,
            disabled: string,
        },
        minimizeBtn: {
            main: string,
            hover: string,
        },
        chat: {
            myMessage: {
                main: string,
                text: string,
                user: string
            },
            otherMessage: {
                main: string,
                text: string,
                user: string
            },
            timestamp: string,
        },
        background: string,
        border: string,
    },
    shadows: {
        openedComponent: number
    },
    border: {
        size: string
    }
}
