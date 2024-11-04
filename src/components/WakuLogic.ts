import { Message, Participant } from "../types/ChatTypes";
import { ref, inject } from "vue";
import { changeTopic, loadPlugin, upgradeMessage } from "../plugins/vue-waku";
import { WakuChatVuePluginOptions } from "../types/ChatTypes";
import { generate } from "random-words";

type WakuData = {
  startWaku?: (stoppedNode: any) => Promise<any>;
  stopWaku?: (node: any) => Promise<any>;
  chatInterfaces?: any[];
  ChatEncoder?: any;
  ChatDecoder?: any;
  ChatOptions?: WakuChatVuePluginOptions;
  lightNode?: any;
  subscription?: any;
  pingInterval?: NodeJS.Timeout;
};

let wakuData: WakuData = {};

const chatState = ref<{
  status: string;
  messageList: Message[];
  room: string;
}>({
  status: "idle",
  messageList: [],
  room: "",
});

let sendMessageToServer = async (msg: Message) => {
  console.log(msg);
};

const myInfo = ref<Participant>({ id: "", name: "", type: "" });

const retrieveMessages = async (
  _channel: string,
  _topic: string,
  callback: (msg: any) => boolean
) => {
  if (!wakuData.lightNode || !wakuData.ChatDecoder) return;
  const topic = _topic.toLowerCase().replace(/\s/g, "");
  const channel = _channel.toLowerCase().replace(/\s/g, "");

  // Choose a content topic
  const contentTopic = `/${channel}/1/${topic}/proto`;

  // Retrieve a week of messages
  const queryOptions: any = {
    contentTopic,
    pageDirection: "backward",
  };
  let messageAgeToDownload = getOptions()?.messageAgeToDownload;

  if (messageAgeToDownload) {
    const endTime = new Date();
    const startTime = new Date();
    startTime.setMilliseconds(endTime.getMilliseconds() - messageAgeToDownload);
    queryOptions.timeFilter = {
      startTime,
      endTime,
    };
  }

  var msgsToDownload = getOptions()?.messagesToDownload;
  queryOptions.pageSize = msgsToDownload ? msgsToDownload : 100;

  await wakuData.lightNode.store.queryWithOrderedCallback(
    [wakuData.ChatDecoder],
    callback,
    queryOptions
  );
};

export const setRoom = async (_room: string) => {
  if (!wakuData.lightNode) return;
  const options = getOptions();
  if (!options) return;
  const channelName = options.wakuChannelName
    ? options.wakuChannelName
    : "my-app";
  const { encoder, decoder } = await changeTopic(channelName, _room);
  wakuData.ChatEncoder = encoder;
  wakuData.ChatDecoder = decoder;

  if (getRoom()) sendMessage("leave", "system");
  const { error, subscription } =
    await wakuData.lightNode.filter.createSubscription({
      contentTopics: [decoder.contentTopic],
    });
  if (error) {
    console.error(error);
    return;
  } else {
    wakuData.subscription = subscription;
  }
  await retrieveMessages(channelName, _room, messageCallback);

  await wakuData.subscription.subscribe(
    [wakuData.ChatDecoder],
    messageCallback
  );

  if (!wakuData.pingInterval)
    wakuData.pingInterval = setInterval(pingAndReinitiateSubscription, 10000);

  chatState.value.room = _room;
  sendMessage("enter", "system");
};

export const onDestroyWaku = () => {
  clearInterval(wakuData.pingInterval);
};

export const getRoom = () => {
  return chatState.value.room;
};

export const getMessageList = () => {
  return chatState.value.messageList;
};

export const getStatus = () => {
  return chatState.value.status;
};

export const setMyID = (_newID: string) => {
  myInfo.value.id = _newID;
  localStorage.setItem("myWakuChatId", _newID);
  setMyName();
};

export const getMyID = () => {
  if (!myInfo.value.id) return localStorage.getItem("myWakuChatId") || "";
  return myInfo.value.id;
};

export const setMyName = (_newName?: string) => {
  if (!_newName) {
    myInfo.value.name = generate({
      exactly: 3,
      minLength: 4,
      join: "-",
      seed: getMyID(),
    });
  } else {
    myInfo.value.name = _newName;
  }
};

export const setMyType = (_newType?: string) => {
  if (_newType) {
    myInfo.value.type = _newType;
  } else {
    myInfo.value.type = "";
  }
};

export const getMyType = () => {
  return myInfo.value.type;
};

export const getMyName = () => {
  return myInfo.value.name;
};

export const privateRoom = (userId: string) => {
  if (userId === getMyID()) setRoom(userId);
  else
    setRoom(
      userId < getMyID()
        ? userId + " & " + getMyID()
        : getMyID() + " & " + userId
    );
};

export const getOptions = () => {
  if (!wakuData.ChatOptions) {
    loadOptions();
  }
  return wakuData.ChatOptions;
};

const loadOptions = () => {
  wakuData.ChatOptions = inject("ChatOptions") as any;
  if (wakuData.ChatOptions && !wakuData.ChatOptions.availableRooms.length) {
    wakuData.ChatOptions.availableRooms = ["General"];
  }
};

const getChatInterface = (version?: number) => {
  if (version === undefined)
    version = wakuData.chatInterfaces?.length
      ? wakuData.chatInterfaces.length - 1
      : 0;
  if (!wakuData.chatInterfaces || wakuData.chatInterfaces.length === 0)
    return undefined;
  return wakuData.chatInterfaces[version];
};

export const loadChat = async () => {
  chatState.value.status = "connecting";
  if (!wakuData.startWaku) wakuData = await loadPlugin();

  if (!wakuData.startWaku) return;
  const options = getOptions();
  if (!options) return;

  wakuData.lightNode = await wakuData.startWaku(wakuData.lightNode);

  if (!getMyID()) {
    setMyID(wakuData.lightNode.libp2p.peerId.toString());
  }
  await setRoom(options.availableRooms[0]);

  sendMessageToServer = async (msg: Message) => {
    if (!wakuData.lightNode) return;
    if (chatState.value.status !== "connected") return;
    if (!wakuData.chatInterfaces?.length || !wakuData.ChatEncoder) return;

    const protoMessage = getChatInterface().create(msg);
    const serialisedMessage = getChatInterface().encode(protoMessage).finish();

    await wakuData.lightNode.lightPush.send(wakuData.ChatEncoder, {
      payload: serialisedMessage,
    });
  };

  chatState.value.status = "connected";
};

export const disconnectChat = async (onDisconnect?: () => void) => {
  if (wakuData.stopWaku) {
    sendMessage("leave", "system");
    clearInterval(wakuData.pingInterval);
    await wakuData.subscription.unsubscribeAll();
    await wakuData.stopWaku(wakuData.lightNode);
    chatState.value.status = "disconnected";
    if (onDisconnect) {
      onDisconnect();
    }
  }
};

export const sendMessage = (
  msgData: string,
  msgType: string,
  responseId?: string
) => {
  if (getStatus() !== "connected") return;
  const timestamp = Date.now();
  const msg: Message = {
    author: myInfo.value,
    room: chatState.value.room,
    type: msgType,
    data: msgData,
    timestamp: timestamp,
    id: getMyID() + timestamp,
    responseTo: responseId,
  };
  setTimeout(async () => {
    await sendMessageToServer(msg);
  }, 0);
};

const messageCallback = (wakuMessage: any) => {
  if (!wakuData.chatInterfaces?.length || !wakuMessage.payload) return false;
  let messageObj: any = undefined;
  let version = wakuData.chatInterfaces.length - 1;
  while (messageObj === undefined && version >= 0) {
    try {
      messageObj = getChatInterface(version).decode(wakuMessage.payload);
    } catch (err) {
      version--;
    }
  }

  if (!messageObj || !messageObj.author) return false;

  if (version < wakuData.chatInterfaces.length - 1)
    messageObj = translateMessage(
      messageObj,
      wakuData.chatInterfaces.length - 1
    );

  const existingMessageIndex = chatState.value.messageList.findIndex(
    (message) => message.id === messageObj.id
  );
  if (existingMessageIndex !== -1) return true;
  const insertIndex = chatState.value.messageList.findIndex(
    (message) => message.timestamp < messageObj.timestamp
  );
  if (insertIndex !== -1) {
    chatState.value.messageList.splice(insertIndex, 0, messageObj);
  } else {
    chatState.value.messageList.push(messageObj);
  }

  return true;
};

const translateMessage = (messageObj: any, chatVersion: number) => {
  while (messageObj.version < chatVersion)
    messageObj = upgradeMessage(messageObj);

  return messageObj;
};

const pingAndReinitiateSubscription = async () => {
  if (!wakuData.lightNode) return;
  if (!wakuData.ChatDecoder) return;
  if (!wakuData.subscription) return;
  try {
    // Ping the subscription
    await wakuData.subscription.ping();
  } catch (error) {
    if (
      // Check if the error message includes "peer has no subscriptions"
      error instanceof Error &&
      error.message.includes("peer has no subscriptions")
    ) {
      const { error, subscription } =
        await wakuData.lightNode.filter.createSubscription({
          contentTopics: [wakuData.ChatDecoder.contentTopic],
        });
      if (error) return;
      else {
        wakuData.subscription = subscription;
      }
      await wakuData.subscription.subscribe(
        [wakuData.ChatDecoder],
        messageCallback
      );
    }
  }
};
