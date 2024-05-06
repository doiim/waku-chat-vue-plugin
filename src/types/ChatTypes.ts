export type Message = {
    id: string;
    author: Participant;
    type: string;
    timestamp: number;
    data: string;
    room: string;
    responseTo?: string;
};

export type Participant = { id: string, name: string }

export interface WakuChatVuePluginOptions {
    wakuChannelName: string,
    wakuPeers?: string[],
    availableRooms: string[],
    allowPrivateChat: boolean,
    cssConfig?: WakuChatConfigCss,
    showSettings?: boolean
    disconnectDelay?: number
    groupMessagesTime?: number
    messagesToDownload?: number
    messageAgeToDownload?: number
    showSystemMessages?: boolean
    userChangeNick?: boolean
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
            response: {
                main: string,
                text: string,
                close: string,
                closeHover: string,
            }
        },
        minimizeBtn: {
            main: string,
            hover: string,
        },
        chat: {
            myMessage: {
                main: string,
                text: string,
                user: string,
                response: {
                    main: string,
                    text: string,
                }
            },
            otherMessage: {
                main: string,
                text: string,
                user: string,
                response: {
                    main: string,
                    text: string,
                }
            },
            disabledResponse: {
                text: string,
                main: string,
            },
            systemMessage: {
                main: string,
                text: string
            },
            reaction: {
                main: string,
                text: string
            }
            timestamp: string,
            interactIcons: string
        },
        background: string,
        border: string,
    },
    shadows: {
        openedComponent: number,
        messageBalloon: number
    },
    border: {
        size: string
    }
    [key: string]: Object | string;
}
