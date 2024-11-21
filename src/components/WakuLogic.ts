import { Message, Participant } from "../types/ChatTypes";
import { ref, inject } from "vue";
import { changeTopic, loadPlugin, upgradeMessage } from "../plugins/vue-waku";
import { WakuChatVuePluginOptions } from "../types/ChatTypes";
import { generate } from "random-words";
import debug from '../utils/debug';

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
  isFetching: boolean;
  lastCursor?: number;
  lowResponseCount: number
}>({
  status: "idle",
  messageList: [],
  room: "",
  isFetching: false,
  lowResponseCount: 0,
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

  let endTime = new Date();
  let startTime = new Date();

  if (messageAgeToDownload && !fetchMsgsOnScroll && !cursor) {
      startTime.setMilliseconds(endTime.getMilliseconds() - messageAgeToDownload);
      queryOptions.timeFilter = { startTime, endTime };
  } else {
    endTime = cursor ? new Date(cursor) : new Date();
    if (cursor) {
      endTime.setMilliseconds(endTime.getMilliseconds() + 1000);
    }
    queryOptions.timeFilter = { endTime };
  }

  try {
    chatState.value.isFetching = true;
    let totalSystemMessages = 0;
    let attempts = 0;
    const maxAttempts = 3; // Prevent infinite loops
        
    debug.ObjectMessage(
      'Fetching Parameters:',
      {
        fetchMsgsOnScroll,
        fetchLimit,
        fetchTotalLimit,
        fetchMaxAttempts,
        messageAgeToDownload,
        'messageAgeToDownloadFormatted': messageAgeToDownload ? `${messageAgeToDownload/(24*60*60*1000)} days` : 'unlimited',
      }
    );
    const wrappedCallback = (msg: any) => {
      try {
        const decodedMsg = getChatInterface().decode(msg.payload);
        if (decodedMsg.type === 'system') {
          totalSystemMessages++;
          return false;
        }

        const result = callback(msg);
        if (result) messagesReceived++;
        return result;
      } catch {
        return false;
      }
    };

    // Keep fetching until we get enough non-system messages or hit max attempts
    while (messagesReceived < fetchLimit && attempts < maxAttempts) {
      await wakuData.lightNode.store.queryWithOrderedCallback(
        [wakuData.ChatDecoder],
        wrappedCallback,
        queryOptions
      );

      // Update cursor for next fetch if needed
      if (messagesReceived < fetchLimit && chatState.value.lastCursor) {
        queryOptions.timeFilter.endTime = new Date(chatState.value.lastCursor);
      }      
      attempts++;
    }

    // Update lowResponseCount based on actual messages received
    if (messagesReceived <= 1) {
      chatState.value.lowResponseCount++;
    } else {
      chatState.value.lowResponseCount = 0;
    }

    debug.ObjectMessage(
      'Retrieved messages:',
      {
        totalSystemMessages,
        messagesReceived,
        attempts,
        lowResponseCount: chatState.value.lowResponseCount
      },
    );

    return messagesReceived;
  } catch (error: unknown) {
    console.error('Error retrieving messages:', error);
    if (error instanceof Error && error.message?.includes('INVALID_CURSOR')) {
      // This is a workaround for the issue where the cursor is invalid
      // it happens when the node responds only system messages and there is no msg body
      // to get the timestamp needded for next new cursor pointer
      // this just prevents the websocket from closing its connection.
      chatState.value.lastCursor = chatState.value.messageList.length > 0 
      // Reset cursor to oldest message in current message list
      ? Math.min(...chatState.value.messageList.map(msg => msg.timestamp))
      // Reset cursor to datetime now() just in case of it happens in the first time fetching
      : Date.now();
    }
    return 0;
  } finally {
    chatState.value.isFetching = false;
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
    debug.ProtocolMessages(msg, 'sent');
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

  debug.ProtocolMessages(messageObj, 'received');

  if (!chatState.value.lastCursor || messageObj.timestamp < chatState.value.lastCursor) {
    chatState.value.lastCursor = messageObj.timestamp;
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
  if (!options) return;

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

export const getLoadingState = () => chatState.value.isFetching;
export const getLowResponseCount = () => chatState.value.lowResponseCount;

export const setFetchLimit = (limit: number) => {
  const options = getOptions();
  if (options) {
    options.fetchLimit = limit;
  }
};

export const setDebugMode = (enabled: boolean) => {
  debug.setDebugEnabled(enabled);
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

export const hasCursorWhileScrolling = () => {
  const options = getOptions();
  return !chatState.value.lastCursor && options?.fetchMsgsOnScroll == true
};

export const tryFetchMessages = async () => {

  // Don't continue if already fetching messages
  if (chatState.value.isFetching) {
    debug.FetchingMessages('alreadyLoading');
    return;
  }

  // Don't continue if we've reached the message limit
  if (hasReachedMessageLimit()) {
    debug.FetchingMessages('limitReached');
    return;
  }

  // Don't continue if we've exceeded fetch attempts
  if (hasExceededFetchAttempts()) {
    debug.FetchingMessages('maxAttempts');
    return;
  }
  
  // Don't continue if we don't have a cursor
  if (hasCursorWhileScrolling()) {
    debug.FetchingMessages('noCursor');
    return;
  }

  // Don't continue because options are needed to determine each cycle behaviour
  if (!getOptions()) {
    debug.FetchingMessages('noOptions');
    return;
  }

  // Start fetching
  debug.FetchingMessages('begin');
  await loadMoreMessages();
  debug.FetchingMessages('end');

};