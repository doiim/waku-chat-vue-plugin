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

export const chatState = ref<{
  status: string;
  messageList: Message[];
  room: string;
  isLoadingMore: boolean;
  lastCursor?: number;
  lowResponseCount: number;
}>({
  status: "idle",
  messageList: [],
  room: "",
  isLoadingMore: false,
  lowResponseCount: 0
});

let sendMessageToServer = async (msg: Message) => {
  console.log(msg);
};

const myInfo = ref<Participant>({ id: "", name: "", type: "" });

export const getFetchMaxAttempts = () => getOptions()?.fetchMaxAttempts || 3;

const retrieveMessages = async (
  _channel: string,
  _topic: string,
  callback: (msg: any) => boolean,
  cursor?: number,
): Promise<number> => {
  const options = getOptions();
  const messageAgeToDownload = options?.messageAgeToDownload;
  const fetchMsgsOnScroll = options?.fetchMsgsOnScroll;
  const fetchLimit = options?.fetchLimit;
  const fetchTotalLimit = options?.fetchTotalLimit || 0;

  if (!wakuData.lightNode || !wakuData.ChatDecoder) return 0;
  const topic = _topic.toLowerCase().replace(/\s/g, "");
  const channel = _channel.toLowerCase().replace(/\s/g, "");

  const contentTopic = `/${channel}/1/${topic}/proto`;
  let messagesReceived = 0;

  const queryOptions: any = {
    contentTopic,
    pageDirection: "backward",
  };



  let endTime = new Date();
  let startTime = new Date();
  console.log('Options in retrieveMessages:', {
    messageAgeToDownload,
    fetchMsgsOnScroll,
    fetchLimit,
    fetchTotalLimit
  });

  if (messageAgeToDownload && !fetchMsgsOnScroll && !cursor) {
      startTime.setMilliseconds(endTime.getMilliseconds() - messageAgeToDownload);
      queryOptions.timeFilter = { startTime, endTime };
      queryOptions.pageSize = getOptions()?.messagesToDownload || 100;
  } else {
    endTime = cursor ? new Date(cursor) : new Date();
    if (cursor) {
      endTime.setMilliseconds(endTime.getMilliseconds() + 1000);
    }
    queryOptions.timeFilter = { endTime };
    queryOptions.pageSize = fetchLimit || 10;
  }

  try {
    chatState.value.isLoadingMore = true;
    console.log('Retrieving messages before:', endTime.toISOString(), {
      fetchMsgsOnScroll,
      pageSize: queryOptions.pageSize,
      fetchLimit: fetchLimit,
      timeFilter: queryOptions.timeFilter,
      fetchTotalLimit: fetchTotalLimit,
      currentMessageCount: getMessageList().length
    });
    
    const wrappedCallback = (msg: any) => {
      const result = callback(msg);
      if (result) messagesReceived++;
      return result;
    };

    await wakuData.lightNode.store.queryWithOrderedCallback(
      [wakuData.ChatDecoder],
      wrappedCallback,
      queryOptions
    );
    
    if (messagesReceived <= 1) {
      chatState.value.lowResponseCount++;
    } else {
      chatState.value.lowResponseCount = 0;
    }

    console.log('Retrieved messages:', {
      requested: queryOptions.pageSize,
      fetchLimit: fetchLimit,
      fetchTotalLimit: fetchTotalLimit,
      received: messagesReceived,
      lowResponseCount: chatState.value.lowResponseCount,
      currentCursor: chatState.value.lastCursor ? new Date(chatState.value.lastCursor).toISOString() : 'none'
    });

    return messagesReceived;

  } finally {
    chatState.value.isLoadingMore = false;
  }
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
  chatState.value.lowResponseCount = 0;
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

  if (!chatState.value.lastCursor || messageObj.timestamp < chatState.value.lastCursor) {
    chatState.value.lastCursor = messageObj.timestamp;
    console.log('Updated cursor to:', new Date(messageObj.timestamp).toISOString());
  }

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
    await wakuData.subscription.ping();
  } catch (error) {
    if (
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

export const loadMoreMessages = async () => {
  console.log('loadMoreMessages called with state:', {
    isLoading: chatState.value.isLoadingMore,
    lastCursor: chatState.value.lastCursor
  });

  if (chatState.value.isLoadingMore || !chatState.value.lastCursor) {
    console.log('(Recursive Call Aborted) - Exiting loadMoreMessages earlier due to state conditions');
    return;
  }

  const options = getOptions();
  if (!options) {
    console.log('No options available, exiting loadMoreMessages');
    return;
  }

  const fetchTotalLimit = options?.fetchTotalLimit || 0;
  if (fetchTotalLimit > 0 && getMessageList().length >= fetchTotalLimit) {
    console.log('Reached total message limit of:', fetchTotalLimit);
    return;
  }

  const channelName = options.wakuChannelName 
    ? options.wakuChannelName 
    : "my-app";

  console.log('Retrieving messages with cursor:', chatState.value.lastCursor);
  await retrieveMessages(
    channelName,
    chatState.value.room,
    messageCallback,
    chatState.value.lastCursor
  );
};

export const getLoadingState = () => chatState.value.isLoadingMore;
export const getLowResponseCount = () => chatState.value.lowResponseCount;

export const setFetchLimit = (limit: number) => {
  const options = getOptions();
  if (options) {
    options.fetchLimit = limit;
  }
};

export const setFetchMaxAttempts = (attempts: number) => {
  const options = getOptions();
  if (options) {
    options.fetchMaxAttempts = attempts;
  }
};

export const setFetchTotalLimit = (max: number) => {
  const options = getOptions();
  if (options) {
    options.fetchTotalLimit = max;
  }
};

export const setFetchMsgsOnScroll = (enabled: boolean) => {
  const options = getOptions();
  if (options) {
    options.fetchMsgsOnScroll = enabled;
  }
};

export const hasReachedMessageLimit = () => {
  const options = getOptions();
  return options?.fetchTotalLimit ? 
         getMessageList().length >= options.fetchTotalLimit : 
         false;
};

export const hasExceededFetchAttempts = () => {
  const options = getOptions();
  const maxAttempts = options?.fetchMaxAttempts || 3;
  return chatState.value.lowResponseCount > maxAttempts;
};

let fetchTimeout: NodeJS.Timeout | null = null;

export const cleanupFetchCycle = () => {
  clearFetchTimeout();
};

const clearFetchTimeout = () => {
  if (fetchTimeout) {
    clearTimeout(fetchTimeout);
    fetchTimeout = null;
  }
};

export const tryFetchMessages = async () => {
  clearFetchTimeout();

  if (chatState.value.isLoadingMore) {
    return; // Abort fetch cycle if already loading
  }
  if (hasReachedMessageLimit()) {
    return; // Abort fetch cycle if reached message limit
  }

  if (hasExceededFetchAttempts()) {
    // Pausing fetch cycle - exceeded max attempts
    fetchTimeout = setTimeout(tryFetchMessages, 15000); 
    return;
  }

  // Standard fetch cycle that happens while observer still visible
  fetchTimeout = setTimeout(tryFetchMessages, 2000);
  console.log('Fetching older messages...');
  await loadMoreMessages();
};
