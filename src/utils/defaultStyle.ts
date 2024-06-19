import { WakuChatConfigCss } from "../types/ChatTypes";

export const defaultCss: WakuChatConfigCss = {
    colors: {
        light: {
            primary: "rgba(41, 79, 204, 1)"
        }
    },
    shadows: {
        openedComponent: 0.1,
        messageBalloon: 0.1
    },
    border: {
        size: '1px'
    }
}

export const applyDefaultStyle = (target: any, source: any) => {
    for (const key in source) {
        if (source[key] instanceof Object) {
            if (!(target[key] instanceof Object)) {
                target[key] = {};
            }
            target[key] = applyDefaultStyle(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target
}