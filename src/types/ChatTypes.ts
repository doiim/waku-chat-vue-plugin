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

export interface ChatComponentOptions {
    wakuChannelName: string,
    wakuPeers?: string[],
    availableRooms: string[],
    changeNickMode: 'message' | 'interface' | 'none',
    allowPrivateChat: boolean,
    cssConfig?: {
        primaryColor?: string,
        primaryColorHover?: string,
        primaryTextColor?: string,
        secondaryColor?: string,
        secondaryColorHover?: string,
        secondaryTextColor?: string,
        backgroundColor?: string,
        myMessageColor?: string,
        myMessageTextColor?: string,
        otherMessageColor?: string,
        otherMessageTextColor?: string,
    }
}