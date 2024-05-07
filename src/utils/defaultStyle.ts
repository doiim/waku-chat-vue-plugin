import { WakuChatConfigCss } from "../types/ChatTypes";

export const defaultCss: WakuChatConfigCss = {
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
            response: {
                main: 'rgba(30, 64, 175, 1)',
                user: 'rgba(147, 197, 253, 1)',
                text: 'rgba(209, 213, 219, 1)',
                close: 'rgba(107, 114, 128, 1)',
                closeHover: 'rgba(30, 64, 175, 1)',
            }
        },
        minimizeBtn: {
            main: 'rgba(107, 114, 128, 1)',
            hover: 'rgba(30, 64, 175, 1)',
        },
        footer: {
            main: 'rgba(249, 250, 251, 1)',
            response: 'rgba(239, 246, 255, 1)'
        },
        chat: {
            myMessage: {
                main: 'rgba(37, 99, 235, 1)',
                user: 'rgba(37, 99, 235, 1)',
                text: 'rgba(249, 250, 251, 1)',
                response: {
                    user: 'rgba(147, 197, 253, 1)',
                    main: 'rgba(30, 64, 175, 1)',
                    text: 'rgba(209, 213, 219, 1)',
                }
            },
            otherMessage: {
                main: 'rgba(229, 231, 235, 1)',
                user: 'rgba(156, 163, 175, 1)',
                text: 'rgba(31, 41, 55, 1)',
                response: {
                    user: 'rgba(209, 213, 219, 1)',
                    main: 'rgba(107, 114, 128, 1)',
                    text: 'rgba(229, 231, 235, 1)',
                }
            },
            systemMessage: {
                main: 'rgba(229, 231, 235, 1)',
                text: 'rgba(37, 99, 235, 1)',
            },
            reaction: {
                main: 'rgba(30, 64, 175, 1)',
                text: 'rgba(249, 250, 251, 1)',
            },
            timestamp: 'rgba(156, 163, 175, 1)',
            interactIcons: {
                main: 'rgba(229, 231, 235, 1)',
                hover: 'rgba(30, 64, 175, 1)',
                text: 'rgba(31, 41, 55, 1)',
                textHover: 'rgba(249, 250, 251, 1)',
            }
        },
        background: 'rgba(249, 250, 251, 1)',
        border: 'rgba(37, 99, 235, 1)',
    },
    shadows: {
        openedComponent: 0.1,
        messageBalloon: 0.1
    },
    border: {
        size: '1px'
    }
}

export const mergeCssConfiguration = (target: any, source: any) => {
    for (const key in source) {
        if (source[key] instanceof Object) {
            if (!(target[key] instanceof Object)) {
                target[key] = {};
            }
            target[key] = mergeCssConfiguration(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target
}