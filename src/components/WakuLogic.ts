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
  if (!wakuData.lightNode) return;
  if (chatState.value.status !== "connected") return;
  if (!wakuData.chatInterfaces?.length || !wakuData.ChatEncoder) return;

  try {
    const protoMessage = getChatInterface().create(msg);
    const serialisedMessage = getChatInterface().encode(protoMessage).finish();

    await wakuData.lightNode.lightPush.send(wakuData.ChatEncoder, {
      payload: serialisedMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
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
  
  // Set default values for fetch parameters
  const messageAgeToDownload = options?.messageAgeToDownload;
  const fetchMsgsOnScroll = options?.fetchMsgsOnScroll ?? true; // Default to true
  const fetchLimit = options?.fetchLimit ?? (fetchMsgsOnScroll ? 10 : 100); // Default based on scroll mode
  const fetchTotalLimit = options?.fetchTotalLimit ?? 0; // Default to no limit
  const fetchMaxAttempts = options?.fetchMaxAttempts ?? 3; // Default to 3 attempts

  if (!wakuData.lightNode || !wakuData.ChatDecoder) return 0;
  const topic = _topic.toLowerCase().replace(/\s/g, "");
  const channel = _channel.toLowerCase().replace(/\s/g, "");

  const contentTopic = `/${channel}/1/${topic}/proto`;
  let messagesReceived = 0;

  const queryOptions: any = {
    contentTopic,
    pageDirection: "backward",
    pageSize: fetchLimit
  };

  console.log('Fetch parameters:', {
    fetchMsgsOnScroll,
    fetchLimit,
    fetchTotalLimit,
    fetchMaxAttempts,
    messageAgeToDownload: messageAgeToDownload ? `${messageAgeToDownload/(24*60*60*1000)} days` : 'unlimited'
  });

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
      queryOptions.pageSize = fetchLimit || 100;
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
      try {
        // Decode message to check type
        const decodedMsg = getChatInterface().decode(msg.payload);
        
        // Only count and process non-system messages
        if (decodedMsg.type !== 'system') {
          const result = callback(msg);
          if (result) messagesReceived++;
          return result;
        }
        return false;
      } catch {
        return false;
      }
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

  } catch (error: unknown) {
    console.error('Error retrieving messages:', error);
    if (error instanceof Error && error.message?.includes('INVALID_CURSOR')) {
      // Reset cursor to oldest message in current message list
      // This is a workaround for the issue where the cursor is invalid
      // it happens when if the node responds as if it has messages but no messages on the body of the response
      // so we can't get the last message timestamp for the new cursor pointer
      // so we just set the cursor to the oldest message in the current message list
      // or reset it to datetime now() just in case of it happens in the first fetch
      chatState.value.lastCursor = chatState.value.messageList.length > 0 
      ? Math.min(...chatState.value.messageList.map(msg => msg.timestamp))
      : Date.now();
    }
    return 0;
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

  // Log the received message with styled console output
  console.log('%c MSG: ' + `${messageObj.data}`,'background: #0066cc; color: white; padding: 2px 6px; border-radius: 2px;');

  if (!chatState.value.lastCursor || messageObj.timestamp < chatState.value.lastCursor) {
    chatState.value.lastCursor = messageObj.timestamp;
    console.log('%c Cursor updated', 'color: #0055bb; padding: 2px 6px; border-radius: 2px;');
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
  const options = getOptions();
  if (!options) {
    console.log('No options available, exiting loadMoreMessages');
    return;
  }

  const channelName = options.wakuChannelName 
    ? options.wakuChannelName 
    : "my-app";

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

export const setMessageAgeToDownload = (age: number) => {
  const options = getOptions();
  if (options) {
    options.messageAgeToDownload = age;
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

export const hasCursorOnScrollFetching = () => {
  const options = getOptions();
  return !chatState.value.lastCursor && options?.fetchMsgsOnScroll == true
};

export const tryFetchMessages = async () => {
  // Don't continue if already loading
  if (chatState.value.isLoadingMore) {
    console.log(
      '%c Already in a fetch cycle, skip creating a new one',
      'background: #FFD700; color: black; padding: 2px 6px; border-radius: 2px;'
    );
    return;
  }

  // Don't continue if we've reached the message limit
  if (hasReachedMessageLimit()) {
    console.log(
      '%c Reached message limit, stopping fetch cycle',
      'background: #4CAF50; color: white; padding: 2px 6px; border-radius: 2px;'
    );
    return;
  }

  // Don't continue if we've exceeded fetch attempts
  if (hasExceededFetchAttempts()) {
    console.log(
      '%c Exceeded fetch attempts, pausing fetch cycle',
      'background: #FF8C00; color: white; padding: 2px 6px; border-radius: 2px;'
    );
    return;
  }
  
  // Don't continue if we don't have a cursor
  if (hasCursorOnScrollFetching()) {
    console.log(
      '%c No cursor available, stopping fetch cycle',
      'background: #FF0000; color: white; padding: 2px 6px; border-radius: 2px;'
    );
    return;
  }

  console.log(
    '%c Fetching older messages...',
    'color: blue; padding: 2px 6px; border-radius: 2px;'
  );
  await loadMoreMessages();
};
