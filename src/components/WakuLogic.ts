import { Message, Participant } from "../types/ChatTypes";
import { ref, inject } from "vue";
import * as protobuf from "protobufjs";
import { LightNode, Encoder, Decoder, IFilterSubscription } from "@waku/sdk";
import { changeTopic } from "../plugins/vue-waku";
import { ChatComponentOptions } from "../types/ChatTypes";

type WakuData = {
    startWaku?: () => Promise<LightNode>,
    ChatInterface?: protobuf.Type,
    ChatEncoder?: Encoder,
    ChatDecoder?: Decoder,
    ChatOptions?: ChatComponentOptions,
    lightNode?: LightNode,
    subscription?: IFilterSubscription,
    pingInterval?: NodeJS.Timeout
}

const wakuData: WakuData = {}

const chatState = ref<{
    status: string,
    messageList: Message[],
    participants: Participant[],
    room: string
}>({
    status: 'idle',
    messageList: [],
    participants: [],
    room: ''
})

let sendMessageToServer = async (msg: Message) => { console.log(msg) };

const myInfo = ref<Participant>({ id: "", name: "User" });

export const setRoom = async (_room: string) => {
    if (!wakuData.lightNode) return
    const options = getOptions()
    if (!options) return
    const channelName = options.wakuChannelName ? options.wakuChannelName : 'my-app'
    const { encoder, decoder } = changeTopic(channelName, _room)
    wakuData.ChatEncoder = encoder as Encoder;
    wakuData.ChatDecoder = decoder as Decoder;

    chatState.value.messageList = []
    chatState.value.participants = [myInfo.value]

    wakuData.subscription = await wakuData.lightNode.filter.createSubscription();
    await wakuData.subscription.subscribe([wakuData.ChatDecoder], messageCallback);

    if (!wakuData.pingInterval)
        wakuData.pingInterval = setInterval(pingAndReinitiateSubscription, 10000);

    chatState.value.room = _room
}

export const onDestroyWaku = () => {
    clearInterval(wakuData.pingInterval)
}

export const getRoom = () => {
    return chatState.value.room
}

export const getMessageList = () => {
    return chatState.value.messageList
}

export const getParticipants = () => {
    return chatState.value.participants
}

export const getStatus = () => {
    return chatState.value.status
}

export const getMyID = () => {
    return myInfo.value.id
}

export const setMyName = (_newName: string) => {
    myInfo.value.name = _newName
}

export const getMyName = () => {
    return myInfo.value.name
}

export const privateRoom = (userId: string) => {
    const myId = myInfo.value.id;
    if (userId === myId)
        setRoom(userId)
    else
        setRoom(userId < myId ? userId + ' & ' + myId : myId + ' & ' + userId);
}

export const getOptions = () => {
    return wakuData.ChatOptions
}

export const initialization = () => {
    wakuData.startWaku = inject("startWaku") as () => Promise<LightNode>;
    wakuData.ChatInterface = inject("chatInterface") as protobuf.Type;
    wakuData.ChatOptions = inject("chatOptions") as any;
    if (wakuData.ChatOptions && !wakuData.ChatOptions.availableRooms.length) {
        wakuData.ChatOptions.availableRooms = ['General']
    }
}

export const loadChat = (async () => {
    chatState.value.status = "connecting"
    if (!wakuData.startWaku) return
    const options = getOptions()
    if (!options) return

    wakuData.lightNode = await wakuData.startWaku();
    myInfo.value.id = wakuData.lightNode.libp2p.peerId.toString();
    myInfo.value.name = `User ${myInfo.value.id.substring(0, 10)}`
    setRoom(options.availableRooms[0])

    sendMessageToServer = async (msg: Message) => {
        if (!wakuData.lightNode) return
        if (chatState.value.status !== "connected") return;
        if (!wakuData.ChatInterface || !wakuData.ChatEncoder) return

        const protoMessage = wakuData.ChatInterface.create(msg);
        const serialisedMessage = wakuData.ChatInterface.encode(protoMessage).finish();

        await wakuData.lightNode.lightPush.send(wakuData.ChatEncoder, {
            payload: serialisedMessage,
        });
    };
    chatState.value.status = "connected";
});

export const sendMessage = (msgData: { text?: string, emoji?: string }, msgType: string) => {
    const timestamp = Date.now()
    const msg: Message = {
        author: myInfo.value,
        room: chatState.value.room,
        liked: false,
        type: msgType,
        data: msgData,
        timestamp: timestamp,
        id: myInfo.value.id + timestamp,
    }
    setTimeout(async () => {
        await sendMessageToServer(msg)
    }, 0);
}

const messageCallback = (wakuMessage: any) => {
    if (!wakuData.ChatInterface || !wakuMessage.payload) return;
    const messageObj: any = wakuData.ChatInterface.decode(wakuMessage.payload);
    if (!messageObj) return

    chatState.value.messageList = [...chatState.value.messageList, messageObj]

    for (let i = 0; i < chatState.value.participants.length; i++) {
        if (chatState.value.participants[i].id === messageObj.author.id) {
            chatState.value.participants[i] = messageObj.author;
            return;
        }
    }
    chatState.value.participants = [...chatState.value.participants, messageObj.author]

};

const pingAndReinitiateSubscription = async () => {
    if (!wakuData.lightNode) return
    if (!wakuData.ChatDecoder) return
    if (!wakuData.subscription) return
    try {
        // Ping the subscription
        await wakuData.subscription.ping();
    } catch (error) {
        if (
            // Check if the error message includes "peer has no subscriptions"
            error instanceof Error &&
            error.message.includes("peer has no subscriptions")
        ) {
            // Reinitiate the subscription if the ping fails
            await wakuData.subscription.subscribe([wakuData.ChatDecoder], messageCallback);
        } else {
            throw error;
        }
    }
};