import { Message, Participant } from "../types/ChatTypes";
import { ref, inject } from "vue";
import { changeTopic, loadPlugin } from "../plugins/vue-waku";
import { WakuChatVuePluginOptions } from "../types/ChatTypes";
import { generate } from "random-words";

type WakuData = {
    startWaku?: (stoppedNode: any) => Promise<any>,
    stopWaku?: (node: any) => Promise<any>,
    ChatInterface?: any,
    ChatEncoder?: any,
    ChatDecoder?: any,
    ChatOptions?: WakuChatVuePluginOptions,
    lightNode?: any,
    subscription?: any,
    pingInterval?: NodeJS.Timeout
}

let wakuData: WakuData = {}

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

const myInfo = ref<Participant>({ id: "", name: "" });

const retrieveMessages = async (_channel: string, _topic: string, callback: (msg: any) => boolean) => {

    if (!wakuData.lightNode || !wakuData.ChatDecoder || !wakuData.ChatInterface) return;
    const topic = _topic.toLowerCase().replace(/\s/g, '');
    const channel = _channel.toLowerCase().replace(/\s/g, '');

    // Choose a content topic
    const contentTopic = `/${channel}/1/${topic}/proto`;

    // Get the time frame
    const endTime = new Date();
    const startTime = new Date();
    let messageAgeToDownload = getOptions()?.messageAgeToDownload
    messageAgeToDownload = messageAgeToDownload ? messageAgeToDownload : 24 * 60 * 60 * 1000
    startTime.setMilliseconds(endTime.getMilliseconds() - messageAgeToDownload);

    // Retrieve a week of messages
    const queryOptions: any = {
        timeFilter: {
            startTime,
            endTime,
        },
        contentTopic,
        pageDirection: "backward",
    };
    if (getOptions()?.messagesToDownload) {
        queryOptions.pageSize = getOptions()?.messagesToDownload
    } else {
        queryOptions.pageSize = 100
    }

    await wakuData.lightNode.store.queryWithOrderedCallback([wakuData.ChatDecoder], callback, queryOptions);

}

export const setRoom = async (_room: string) => {
    if (!wakuData.lightNode) return
    const options = getOptions()
    if (!options) return
    const channelName = options.wakuChannelName ? options.wakuChannelName : 'my-app'
    const { encoder, decoder } = await changeTopic(channelName, _room)
    wakuData.ChatEncoder = encoder;
    wakuData.ChatDecoder = decoder;

    chatState.value.participants = [myInfo.value]

    if (getRoom())
        sendMessage('leave', 'system')
    wakuData.subscription = await wakuData.lightNode.filter.createSubscription();
    await retrieveMessages(channelName, _room, messageCallback)

    await wakuData.subscription.subscribe([wakuData.ChatDecoder], messageCallback);


    if (!wakuData.pingInterval)
        wakuData.pingInterval = setInterval(pingAndReinitiateSubscription, 10000);

    chatState.value.room = _room
    sendMessage('enter', 'system')
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

export const setMyID = (_newID: string) => {
    myInfo.value.id = _newID
    localStorage.setItem('myWakuChatId', _newID);
    setMyName()
}

export const getMyID = () => {
    if (!myInfo.value.id)
        return localStorage.getItem('myWakuChatId') || '';
    return myInfo.value.id
}

export const setMyName = (_newName?: string) => {
    if (!_newName) {
        myInfo.value.name = generate({ exactly: 3, minLength: 4, join: '-', seed: getMyID() })
    } else {
        myInfo.value.name = _newName
    }
}

export const getMyName = () => {
    return myInfo.value.name
}

export const privateRoom = (userId: string) => {
    if (userId === getMyID())
        setRoom(userId)
    else
        setRoom(userId < getMyID() ? userId + ' & ' + getMyID() : getMyID() + ' & ' + userId);
}

export const getOptions = () => {
    if (!wakuData.ChatOptions) {
        loadOptions();
    }
    return wakuData.ChatOptions
}

const loadOptions = () => {
    wakuData.ChatOptions = inject("ChatOptions") as any;
    if (wakuData.ChatOptions && !wakuData.ChatOptions.availableRooms.length) {
        wakuData.ChatOptions.availableRooms = ['General']
    }
}

export const loadChat = (async () => {
    chatState.value.status = "connecting"
    if (!wakuData.startWaku)
        wakuData = await loadPlugin()

    if (!wakuData.startWaku) return
    const options = getOptions()
    if (!options) return

    wakuData.lightNode = await wakuData.startWaku(wakuData.lightNode);

    if (!getMyID()) {
        setMyID(wakuData.lightNode.libp2p.peerId.toString());
    }
    await setRoom(options.availableRooms[0])

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

export const disconnectChat = async () => {
    if (wakuData.stopWaku) {
        sendMessage('leave', 'system')
        clearInterval(wakuData.pingInterval)
        await wakuData.subscription.unsubscribeAll();
        await wakuData.stopWaku(wakuData.lightNode)
        chatState.value.status = 'disconnected'
    }
}

export const sendMessage = (msgData: string, msgType: string) => {
    if (getStatus() !== 'connected') return
    const timestamp = Date.now()
    const msg: Message = {
        author: myInfo.value,
        room: chatState.value.room,
        type: msgType,
        data: msgData,
        timestamp: timestamp,
        id: getMyID() + timestamp,
    }
    setTimeout(async () => {
        await sendMessageToServer(msg)
    }, 0);
}

const messageCallback = (wakuMessage: any) => {
    if (!wakuData.ChatInterface || !wakuMessage.payload) return false;
    let messageObj: any = undefined;
    try {
        messageObj = wakuData.ChatInterface.decode(wakuMessage.payload);
    } catch (err) {
        console.error("Decoding Error: ", err)
        return false
    }
    if (!messageObj) return false;

    const existingMessageIndex = chatState.value.messageList.findIndex(message => message.id === messageObj.id);
    if (existingMessageIndex !== -1) return true;
    const insertIndex = chatState.value.messageList.findIndex(message => message.timestamp > messageObj.timestamp);
    if (insertIndex !== -1) {
        chatState.value.messageList.splice(insertIndex, 0, messageObj);
    } else {
        chatState.value.messageList.push(messageObj);
    }

    const authorIndex = chatState.value.participants.findIndex(participant => participant.id === messageObj.author.id);
    if (authorIndex !== -1) {
        chatState.value.participants[authorIndex] = messageObj.author;
    } else {
        chatState.value.participants.push(messageObj.author);
    }
    return true
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
            wakuData.subscription = await wakuData.lightNode.filter.createSubscription();
            await wakuData.subscription.subscribe([wakuData.ChatDecoder], messageCallback);
        } else {
            throw error;
        }
    }
};