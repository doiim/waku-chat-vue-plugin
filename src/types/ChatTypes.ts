export type Message = {
  id: string;
  author: Participant;
  type: string;
  timestamp: number;
  data: string;
  room: string;
  responseTo?: string;
};

export type Participant = { id: string; name: string; type: string };

export interface WakuChatVuePluginOptions {
  wakuChannelName: string;
  wakuPeers?: string[];
  availableRooms: string[];
  allowPrivateChat: boolean;
  styleConfig?: WakuChatConfigCss;
  theme?: "Dark" | "Light";
  showSettings?: boolean;
  disconnectDelay?: number;
  groupMessagesTime?: number;
  messagesToDownload?: number;
  messageAgeToDownload?: number;
  showSystemMessages?: boolean;
  userChangeNick?: boolean;
  hideClose?: boolean;
}

export interface WakuChatColorConfig {
  light: {
    primary: string;
    secondary?: string;
    tertiary?: string;
    quaternary?: string;
  };
  dark?: {
    primary: string;
    secondary?: string;
    tertiary?: string;
    quaternary?: string;
  };
}

export interface WakuChatConfigCss {
  colors: WakuChatColorConfig;
  shadows: {
    openedComponent: number;
    messageBalloon: number;
  };
  border: {
    size: string;
  };
  [key: string]: Object | string;
}
