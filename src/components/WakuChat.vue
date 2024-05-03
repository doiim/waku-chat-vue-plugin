<script setup lang="ts">
import { ref, watchEffect, defineProps, computed, TransitionGroup, watch, onBeforeUnmount } from "vue";
import { WakuChatConfigCss } from "../types/ChatTypes";
import {
  sendMessage,
  loadChat,
  setRoom,
  getStatus,
  getMessageList,
  getRoom,
  setMyName,
  getMyName,
  setMyID,
  getMyID,
  getOptions,
  onDestroyWaku,
  disconnectChat
} from "../components/WakuLogic"

const props = defineProps<{
  externalUserId?: string;
  externalUserName?: string;
}>()

const propUserId = computed(() => {
  return props.externalUserId
});

const propUserName = computed(() => {
  return props.externalUserName
});

const isChatOpen = ref<boolean>(false);
const settingsMenu = ref<boolean>(false);
const loadingRoom = ref<boolean>(false);

const messageInput = ref<string>('');
const showSettings = ref<boolean>(false);
const showSystemMessages = ref<boolean>(false);
const userShowSystemMessages = ref<boolean>(false);

const computedCss = ref<WakuChatConfigCss>({
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
        main: 'rgba(229, 231, 235, 1)',
        text: 'rgba(31, 41, 55, 1)',
        close: 'rgba(107, 114, 128, 1)',
        closeHover: 'rgba(30, 64, 175, 1)',
      }
    },
    minimizeBtn: {
      main: 'rgba(107, 114, 128, 1)',
      hover: 'rgba(30, 64, 175, 1)',
    },
    chat: {
      myMessage: {
        main: 'rgba(37, 99, 235, 1)',
        user: 'rgba(37, 99, 235, 1)',
        text: 'rgba(249, 250, 251, 1)',
        response: {
          main: 'rgb(104 144 231)',
          text: 'rgba(249, 250, 251, 1)',
        }
      },
      otherMessage: {
        main: 'rgba(229, 231, 235, 1)',
        user: 'rgba(156, 163, 175, 1)',
        text: 'rgba(31, 41, 55, 1)',
        response: {
          main: 'rgb(180 199 235)',
          text: 'rgba(31, 41, 55, 1)',
        }
      },
      disabledResponse: {
        text: 'rgba(249, 250, 251, 1)',
        main: 'rgba(156, 163, 175, 1)',
      },
      systemMessage: {
        main: 'rgba(229, 231, 235, 1)',
        text: 'rgba(37, 99, 235, 1)',
      },
      reaction: {
        main: 'rgba(10, 10, 235, 1)',
        text: 'rgba(249, 250, 251, 1)',
      },
      timestamp: 'rgba(156, 163, 175, 1)',
      interactIcons: 'rgba(37, 99, 235, 1)'
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
});

const editMode = ref(false);
const editedUserName = ref('');

const messageContainerRef = ref<HTMLElement | null>(null);

const roomDropdownOpened = ref<boolean>(false);

const handleToggleRoomDropdown = () => {
  roomDropdownOpened.value = !roomDropdownOpened.value
}

onBeforeUnmount(() => {
  onDestroyWaku();
});

const enterEditMode = () => {
  editMode.value = true;
  editedUserName.value = getMyName()
};
const exitEditMode = () => {
  editMode.value = false;
};

const saveEditedUserName = () => {
  const myName = getMyName()
  setMyName(editedUserName.value);
  sendMessage('changeName:' + myName, 'system')
  exitEditMode()
};

const changeRoomDropdown = async (selectedRoom: string) => {
  handleToggleRoomDropdown()
  if (selectedRoom === getRoom()) return
  loadingRoom.value = true
  await setRoom(selectedRoom);
  loadingRoom.value = false
};

const idleTimeout = ref<NodeJS.Timeout>()

const openChat = async () => {
  clearTimeout(idleTimeout.value)
  if (getStatus() !== "connected") {
    showSettings.value = !!getOptions()?.showSettings;
    showSystemMessages.value = !!getOptions()?.showSystemMessages;
    if (propUserId.value) {
      setMyID(propUserId.value)
    }
    if (propUserName.value) {
      setMyName(propUserName.value)
    }
    await loadChat()
  }
  isChatOpen.value = true
}

const closeChat = () => {
  isChatOpen.value = false
  const disconnectDelay = getOptions()?.disconnectDelay
  idleTimeout.value = setTimeout(disconnectChat, disconnectDelay ? disconnectDelay : 5 * 60 * 1000)
}

const handleSendMessage = () => {
  if (messageInput.value) {
    var responseId = responseTo.value !== undefined ? groupedMessages.value[responseTo.value][0].id : undefined
    sendMessage(messageInput.value, 'text', responseId)
    responseTo.value = undefined
  }
  messageInput.value = ''
}

const scrollToBottom = () => {
  setTimeout(() => {
    const container = messageContainerRef.value;
    if (container) {
      const scrollHeight = container.scrollHeight;
      const scrollTop = container.scrollTop;
      let count = 0;

      const scrollInterval = setInterval(() => {
        if (count < 100) {
          container.scrollTop = scrollTop + (scrollHeight - scrollTop) * 0.5 * (1 - Math.cos(++count * (Math.PI / 100)));
        } else {
          clearInterval(scrollInterval);
        }
      }, 5);
    }
  }, 300);
};

const scrollToMessage = (id: string) => {
  setTimeout(() => {
    const container = messageContainerRef.value;
    if (container) {
      const messageElement = container.querySelector(`#${id}`);
      if (messageElement) {
        const containerRect = container.getBoundingClientRect();
        const messageRect = messageElement.getBoundingClientRect();
        const scrollTop = container.scrollTop;
        const targetTop = messageRect.top - containerRect.top + scrollTop;
        let count = 0;

        const scrollInterval = setInterval(() => {
          if (count < 100) {
            container.scrollTop = scrollTop + (targetTop - scrollTop) * 0.5 * (1 - Math.cos(++count * (Math.PI / 100)));
          } else {
            clearInterval(scrollInterval);
          }
        }, 5);
      }
    }
  }, 300);
}

watch([showSystemMessages, userShowSystemMessages], () => {
  scrollToBottom();
});

watch([propUserId], () => {
  if (propUserId.value) {
    setMyID(propUserId.value)
  }
});

watch([propUserName], () => {
  setMyName(propUserName.value)
});

watchEffect(() => {
  if (getStatus() === "connected" && groupedMessages.value.length > 0)
    scrollToBottom();
});

const groupedMessages = computed(() => {
  let groupMessagesTime = getOptions()?.groupMessagesTime
  groupMessagesTime = groupMessagesTime ? groupMessagesTime : 1 * 60 * 1000

  const filteredMessages = getMessageList().filter(message => {
    return message.room === getRoom() && message.type !== 'reaction';
  })

  if (!filteredMessages[0]) return []

  const groupedMsgs = [];
  let currentGroup = [filteredMessages[0]];

  for (let i = 1; i < filteredMessages.length; i++) {
    const currentMsg = filteredMessages[i];
    const previousMsg = filteredMessages[i - 1];

    if (
      currentMsg.author.id === previousMsg.author.id &&
      currentMsg.author.name === previousMsg.author.name &&
      currentMsg.type !== 'system' &&
      previousMsg.type !== 'system' &&
      !currentMsg.responseTo &&
      Math.abs(previousMsg.timestamp - currentMsg.timestamp) <= groupMessagesTime
    ) {
      currentGroup.push(currentMsg);
    } else {
      groupedMsgs.push(currentGroup);
      currentGroup = [currentMsg];
    }
  }
  groupedMsgs.push(currentGroup);

  return groupedMsgs;
});

const mergeObjects = (target: any, source: any) => {
  for (const key in source) {
    if (source[key] instanceof Object) {
      if (!(target[key] instanceof Object)) {
        target[key] = {};
      }
      mergeObjects(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

const reactions = computed(() => {
  return getMessageList().filter(message => {
    return message.room === getRoom() && message.type === 'reaction';
  })
})

const getMessageReactions = (msgId: string) => {
  const lastReactionsByAuthor: Map<string, string> = new Map();
  reactions.value.forEach((reaction) => {
    if (reaction.responseTo === msgId) {
      lastReactionsByAuthor.set(reaction.author.id, reaction.data);
    }
  });

  const reacts: { reaction: string, quantity: number }[] = [];
  lastReactionsByAuthor.forEach((reaction) => {
    const index = reacts.findIndex((react) => react.reaction === reaction);
    if (index !== -1) {
      reacts[index].quantity++;
    } else {
      reacts.push({ reaction: reaction, quantity: 1 });
    }
  });
  return reacts
}

const checkPreviousMsgName = (idx: number) => {
  return !(idx > 0
    && groupedMessages.value[idx - 1][0].type === 'text'
    && groupedMessages.value[idx][0].author.id === groupedMessages.value[idx - 1][0].author.id
    && groupedMessages.value[idx][0].author.name === groupedMessages.value[idx - 1][0].author.name)
}

watchEffect(() => {
  const options = getOptions();
  const colorConfig = options?.cssConfig as Record<string, any> | undefined;;

  if (!colorConfig) return;

  mergeObjects(computedCss.value, colorConfig);
});

const emit = defineEmits<{
  myStyle: [myStyle: string]
}>()


const responseTo = ref<number | undefined>(undefined);

const setResponse = (groupedMsgIdx: number | undefined) => {
  responseTo.value = groupedMsgIdx
}

const messageReacted = (messageId: string) => {
  for (var i = reactions.value.length - 1; i >= 0; i--) {
    if (reactions.value[i].author.id === getMyID() && reactions.value[i].responseTo === messageId) {
      if (reactions.value[i].data !== 'none') {
        return true
      }else {
        return false
      }
    }
  }
  return false
}

const reactMessage = (groupedMsgIdx: number, reaction: string) => {
  var messageId = groupedMessages.value[groupedMsgIdx][0].id
  sendMessage(reaction, 'reaction', messageId)
}

const groupedResponse = (id: string) => {
  for (var i = 0; i < groupedMessages.value.length; i++) {
    if (groupedMessages.value[i][0].id === id) {
      return groupedMessages.value[i]
    }
  }
  return []
}

const computedStyles = ref<any>({});

const formatTimestamp = (timestamp: number) => {
  const now = new Date();
  const messageDate = new Date(timestamp);

  if (now.toDateString() === messageDate.toDateString()) return (new Date(timestamp)).toLocaleTimeString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === messageDate.toDateString()) return 'Yesterday';

  const seconds = Math.floor((now.getTime() - timestamp) / 1000);

  if (seconds < (86400 * 7)) return `${Math.floor(seconds / 86400)} day${seconds < 86400 * 2 ? '' : 's'} ago`;
  if (seconds < (86400 * 30)) return `${Math.floor(seconds / (86400 * 7))} week${seconds < (86400 * 7) * 2 ? '' : 's'} ago`;
  if (seconds < (86400 * 365)) return `${Math.floor(seconds / (86400 * 30))} month${seconds < (86400 * 30) * 2 ? '' : 's'} ago`;

  return `${Math.floor(seconds / (86400 * 365))} year${seconds < (86400 * 365) * 2 ? '' : 's'} ago`;
}

const printSystemMessage = (msg: any) => {
  if (msg.data === 'enter') {
    return `${msg.author.name} just entered the room`
  } else if (msg.data === 'leave') {
    return `${msg.author.name} just left the room`
  } else if (msg.data.indexOf('changeName:') !== -1) {
    return `${msg.data.split('changeName:')[1]} changed its name to ${msg.author.name}`
  }
  return ''
}

watchEffect(() => {
  computedStyles.value = {
    '.user-name-input': {
      width: '100%'
    },
    '.user-name-input input': {
      lineHeight: '16px',
      width: '50%',
      outline: 'none',
      paddingLeft: '8px',
      color: computedCss.value.colors.subHeader.editName.text,
      backgroundColor: computedCss.value.colors.subHeader.editName.main
    },
    '.user-name-input div span': {
      maxWidth: '50%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontSize: '12px !important'
    },
    '.user-name-input svg': {
      cursor: 'pointer',
      stroke: computedCss.value.colors.subHeader.editName.text,
      marginLeft: '8px'
    },
    '.user-name-input>div': {
      display: 'flex',
      width: '100%'
    },
    '.change-name-btn': {
      cursor: 'pointer',
      marginLeft: '8px',
      color: computedCss.value.colors.subHeader.text,
      background: 'transparent',
      border: 'none'
    },
    '.change-name-btn:hover': {
      color: computedCss.value.colors.subHeader.textHover
    },
    '.cancel-change-name-btn': {
      cursor: 'pointer',
      marginLeft: 'auto',
      color: computedCss.value.colors.subHeader.text,
      background: 'transparent',
      border: 'none'
    },
    '.cancel-change-name-btn:hover': {
      color: computedCss.value.colors.subHeader.textHover
    },
    '.room-dropdown': {
      position: 'relative',
      display: 'inline-block'
    },
    '.dropdown-content': {
      display: 'block',
      left: '-62px',
      position: 'absolute',
      backgroundColor: computedCss.value.colors.room.dropdown.main,
      minWidth: '136px',
      zIndex: '1',
      maxWidth: '344px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      borderRadius: '8px'
    },
    '.dropdown-content button': {
      color: computedCss.value.colors.room.dropdown.text,
      padding: '12px 16px',
      textDecoration: 'none',
      display: 'block',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left',
      fontWeight: '600',
      border: 'none',
      background: 'none',
      transition: 'background-color 0.3s ease-in-out',
      borderRadius: '8px'
    },
    '.dropdown-content .selected': {
      color: computedCss.value.colors.room.dropdown.selected
    },
    '.dropdown-content button:hover': {
      backgroundColor: computedCss.value.colors.room.dropdown.hover
    },
    '.dropdown-button': {
      display: 'flex',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      lineHeight: '14px',
      alignItems: "center",
      color: computedCss.value.colors.room.btn.text,
      stroke: computedCss.value.colors.room.btn.text
    },
    '.dropdown-button svg': {
      marginLeft: '8px'
    },
    '.dropdown-button:hover': {
      color: computedCss.value.colors.room.btn.textHover,
      stroke: computedCss.value.colors.room.btn.textHover,
      textDecoration: 'underline'
    },
    '.chat-container': {
      width: '360px',
      height: '600px',
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      backgroundColor: computedCss.value.colors.background,
      border: computedCss.value.border.size + ' solid ' + computedCss.value.colors.border,
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.3s ease-in-out',
      boxShadow: '0px 10px 25px -5px rgba(0, 0, 0, ' + computedCss.value.shadows.openedComponent + ')'
    },
    '.chat-container.open': {
      transform: 'translateY(0)'
    },
    '.change-room-overlay': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '8px',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      stroke: computedCss.value.colors.border,
      textAlign: 'center',
      alignContent: 'center',
      zIndex: 1000,
    },
    '.change-room-overlay svg': {
      animation: 'spin 1s linear infinite'
    },
    '.chat-header': {
      backgroundColor: computedCss.value.colors.header.main,
      color: computedCss.value.colors.header.text,
      padding: '12px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px'
    },
    '.settings-section': {
      display: 'flex',
      alignItems: 'center'
    },
    '.settings-button': {
      color: computedCss.value.colors.header.btn,
      background: 'transparent',
      lineHeight: '14px',
      border: 'none'
    },
    '.settings-button:hover': {
      color: computedCss.value.colors.header.btnHover,
      textDecoration: 'underline',
      cursor: 'pointer'
    },
    '.user-section': {
      display: 'flex',
      fontSize: '12px !important',
      width: '100%',
      justifyContent: 'space-between'
    },
    '.system-message-section': {
      display: 'flex',
      fontSize: '12px !important',
      width: '100%',
    },
    '.system-message-section input': {
      margin: '0px',
      cursor: 'pointer'
    },
    '.system-message-section label': {
      marginLeft: '8px',
      cursor: 'pointer'
    },
    '.room-section': {
      display: 'flex',
      width: '100%',
      alignItems: 'center'
    },
    '.chat-subHeader': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'normal',
      padding: '16px',
      minHeight: '48px',
      fontSize: '12px !important',
      gap: '8px',
      backgroundColor: computedCss.value.colors.subHeader.main,
      color: computedCss.value.colors.subHeader.text
    },
    '.non-edit': {
      cursor: 'default'
    },
    '.edit-user-input': {
      border: 'none',
      borderRadius: '8px',
      margin: '4px 0px',
      height: '38px',
      width: '100%'
    },
    '.room-info': {
      marginRight: '10px',
      lineHeight: '16px',
      fontSize: '12px !important',
      color: computedCss.value.colors.header.text
    },
    '.room-name': {
      fontWeight: 'bold'
    },
    '.chat-body': {
      flex: '1',
      overflowY: 'auto',
      padding: '16px 1px 0px 16px',
      marginRight: '15px'
    },
    '.chat-body::-webkit-scrollbar': {
      width: '5px'
    },
    '.chat-body::-webkit-scrollbar-thumb': {
      backgroundColor: computedCss.value.colors.border,
      borderRadius: '5px',
    },
    '.chat-footer': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 30px 24px 30px'
    },
    '.response-input': {
      backgroundColor: computedCss.value.colors.input.response.main,
      color: computedCss.value.colors.input.response.text,
      width: '100%',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      display: 'flex'
    },
    '.response-input > div': {
      padding: '8px',
      width: '85%',
    },
    '.response-input > div > div': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '.response-input button': {
      stroke: computedCss.value.colors.input.response.close,
      alignSelf: 'center',
      marginLeft: 'auto',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
    },
    '.response-input button:hover': {
      stroke: computedCss.value.colors.input.response.closeHover,
    },
    '.message-input': {
      display: 'flex',
      width: '100%',
      height: '48px',
      padding: '0px 12px',
      lineHeight: '16px',
      borderRadius: '8px',
      backgroundColor: computedCss.value.colors.input.main
    },
    '.message-input input': {
      width: '100%',
      outline: 'none',
      border: 'none',
      color: computedCss.value.colors.input.text,
      backgroundColor: computedCss.value.colors.input.main
    },
    '.message-input input::placeholder': {
      color: computedCss.value.colors.input.placeholder,
      opacity: "1",
    },
    '.message-input input::-ms-input-placeholder': {
      color: computedCss.value.colors.input.placeholder,
    },
    '.message-input button': {
      marginLeft: 'auto'
    },
    '.open-button, .load-button, .spinner': {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      transition: 'backgroundColor 0.3s ease-in-out',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'fixed',
      right: '34px',
      bottom: '36px'
    },
    '.open-button, .load-button, .minimize-button, .send-button': {
      cursor: 'pointer',
      borderWidth: '0px',
    },
    '.load-button': {
      backgroundColor: computedCss.value.colors.loadBtn.main,
      color: computedCss.value.colors.loadBtn.text,
      fill: computedCss.value.colors.loadBtn.text
    },
    '.load-button:hover': {
      backgroundColor: computedCss.value.colors.loadBtn.hover,
      color: computedCss.value.colors.loadBtn.textHover,
      fill: computedCss.value.colors.loadBtn.textHover
    },
    '.open-button': {
      backgroundColor: computedCss.value.colors.openBtn.main,
      color: computedCss.value.colors.openBtn.text,
      fill: computedCss.value.colors.openBtn.text
    },
    '.open-button:hover': {
      backgroundColor: computedCss.value.colors.openBtn.hover,
      color: computedCss.value.colors.openBtn.textHover,
      fill: computedCss.value.colors.openBtn.textHover
    },
    '.spinner': {
      backgroundColor: computedCss.value.colors.loadingBtn.main,
      color: computedCss.value.colors.loadingBtn.text,
      stroke: computedCss.value.colors.loadingBtn.text,
    },
    '.minimize-button': {
      marginLeft: '32px',
      stroke: computedCss.value.colors.minimizeBtn.main,
      background: 'transparent',
    },
    '.minimize-button svg': {
      verticalAlign: 'middle'
    },
    '.minimize-button:hover': {
      stroke: computedCss.value.colors.minimizeBtn.hover
    },
    '.send-button': {
      background: 'transparent',
      marginTop: '4px'
    },
    '.send-button svg': {
      fill: computedCss.value.colors.sendBtn.main,
      color: computedCss.value.colors.sendBtn.text
    },
    '.send-button:hover svg': {
      fill: computedCss.value.colors.sendBtn.hover,
      color: computedCss.value.colors.sendBtn.textHover
    },
    '.send-button:disabled': {
      cursor: 'auto'
    },
    '.send-button:disabled svg': {
      fill: computedCss.value.colors.sendBtn.disabled,
      color: computedCss.value.colors.sendBtn.text
    },
    '.spinner svg': {
      animation: 'spin 1s linear infinite'
    },
    '.own-message .message': {
      backgroundColor: computedCss.value.colors.chat.myMessage.main,
      fontWeight: '400',
      color: computedCss.value.colors.chat.myMessage.text,
    },
    '.own-message .timestamp': {
      marginLeft: 'auto'
    },
    '.own-message .user-name-baloon': {
      marginLeft: 'auto',
      color: computedCss.value.colors.chat.myMessage.user
    },
    '.own-message .grouped-response .message': {
      marginLeft: 'auto',
      backgroundColor: computedCss.value.colors.chat.myMessage.response.main,
      color: computedCss.value.colors.chat.myMessage.response.text,
    },
    '.user-name-baloon': {
      fontSize: '10px !important',
      lineHeight: '12px',
      marginBottom: '4px',
      color: computedCss.value.colors.chat.otherMessage.user
    },
    '.message-container': {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end'
    },
    '.grouped-response .message': {
      backgroundColor: computedCss.value.colors.chat.otherMessage.response.main,
      color: computedCss.value.colors.chat.otherMessage.response.text,
      padding: '8px',
      cursor: 'pointer'
    },
    '.grouped-message': {
      display: 'flex',
      width: '100%',
    },
    '.response-disabled .message': {
      color: computedCss.value.colors.chat.disabledResponse.text + " !important",
      backgroundColor: computedCss.value.colors.chat.disabledResponse.main + " !important",
      fontStyle: 'italic',
      cursor: 'default'
    },
    '.grouped-message button': {
      alignSelf: 'center',
      marginRight: '4px',
      marginLeft: '4px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      transform: 'scaleX(-1)'
    },
    '.grouped-message button:first-child': {
      marginRight: 'auto',
    },
    '.grouped-message:hover > button svg': {
      stroke: computedCss.value.colors.chat.interactIcons,
    },
    '.own-message .grouped-message button': {
      alignSelf: 'center',
      marginRight: '4px',
      marginLeft: '4px',
      transform: 'scaleX(1)'
    },
    '.own-message .grouped-message button:first-child': {
      marginLeft: 'auto',
    },
    '.message': {
      position: 'relative',
      lineHeight: '16px',
      minWidth: '96px',
      maxWidth: '67%',
      padding: '12px',
      borderRadius: '8px',
      backgroundColor: computedCss.value.colors.chat.otherMessage.main,
      color: computedCss.value.colors.chat.otherMessage.text,
      boxShadow: `0px 1px 3px 0px rgba(0, 0, 0, ${computedCss.value.shadows.messageBalloon})`
    },
    '.system-message': {
      lineHeight: '16px',
      minWidth: '96px',
      width: '80%',
      padding: '2px, 8px, 2px, 8px',
      margin: '8px',
      borderRadius: '4px',
      alignSelf: 'center !important',
      textAlign: 'center',
      backgroundColor: computedCss.value.colors.chat.systemMessage.main,
      color: computedCss.value.colors.chat.systemMessage.text,
      boxShadow: `0px 1px 3px 0px rgba(0, 0, 0, ${computedCss.value.shadows.messageBalloon})`
    },
    '.timestamp': {
      color: computedCss.value.colors.chat.timestamp,
      margin: '8px 0px 8px 0px',
      fontSize: '9px !important',
      lineHeight: '9px',
    },
    '.message-content': {
      wordWrap: 'break-word'
    },
    '.message-react': {
      position: 'absolute',
      bottom: '-8px',
      right: '8px'
    },
    '.message-react button': {
      background: computedCss.value.colors.chat.reaction.main,
      borderRadius: '12px',
      color: computedCss.value.colors.chat.reaction.text,
      stroke: computedCss.value.colors.chat.reaction.text
    },
    '@keyframes spin': {
      '0%': {
        transform: 'rotate(0deg)'
      },
      '100%': {
        transform: 'rotate(360deg)'
      }
    },
    '.waku-chat-vue-plugin div, .waku-chat-vue-plugin button, .waku-chat-vue-plugin span, .waku-chat-vue-plugin input': {
      fontFamily: 'IBM Plex Sans',
      fontSize: '14px'
    },
    '.slide-enter-active': {
      animation: 'translate-out .5s reverse',
    },
    '.slide-leave-active': {
      animation: 'translate-out .5s',
    },
    '@keyframes translate-out': {
      '0%': {
        transform: 'translateY(0%)',
      },
      '100%': {
        transform: 'translateY(110%)',
      }
    },
    '.fade-enter-active': {
      animation: 'fade-in .5s',
    },
    '.fade-leave-active': {
      animation: 'fade-in .5s reverse',
    },
    '@keyframes fade-in': {
      '0%': {
        opacity: '0',
      },
      '100%': {
        opacity: '1',
      }
    },
    '.fastFade-enter-active': {
      animation: 'fastFade-in .5s',
    },
    '.fastFade-leave-active': {
      animation: 'fastFade-in .5s reverse',
    },
    '@keyframes fastFade-in': {
      '0%': {
        opacity: '0',
      },
      '60%': {
        opacity: '0',
      },
      '100%': {
        opacity: '1',
      }
    }
  }

  emit('myStyle', computedStyles.value)
});

</script>

<template>
  <div class="waku-chat-vue-plugin">
    <div v-if="getStatus() === 'connected'" key="connected">
      <Transition name="slide" mode="out-in">
        <div v-if="isChatOpen" class="chat-container">
          <Transition name="fade" mode="out-in">
            <div v-if="loadingRoom" class="change-room-overlay">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.4" stroke-width="4" />
                <path
                  d="M12 22C10.6868 22 9.38642 21.7413 8.17317 21.2388C6.95991 20.7362 5.85752 19.9997 4.92893 19.0711C4.00035 18.1425 3.26375 17.0401 2.7612 15.8268C2.25866 14.6136 2 13.3132 2 12"
                  stroke-opacity="0.8" stroke-width="4" />
                <path
                  d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.76121C17.0401 3.26375 18.1425 4.00035 19.0711 4.92894C19.9997 5.85752 20.7363 6.95992 21.2388 8.17317C21.7413 9.38643 22 10.6868 22 12"
                  stroke-opacity="0.8" stroke-width="4" />
              </svg>
            </div>
          </Transition>
          <div class="chat-header">
            <div class="room-section">
              <div class="room-info">
                Room
              </div>
              <div class="room-dropdown">
                <button class="dropdown-button" @click="handleToggleRoomDropdown">
                  <div>{{ getRoom() }}</div>
                  <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6.5L8 10.5L12 6.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
                <div v-if="roomDropdownOpened" class="dropdown-content">
                  <div v-for="availableRoom in getOptions()?.availableRooms" :key="availableRoom">
                    <button :class="availableRoom === getRoom() ? 'selected' : ''"
                      @click="changeRoomDropdown(availableRoom)">
                      {{ availableRoom }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="showSettings" class="settings-section">
              <button @click="settingsMenu = !settingsMenu" class="settings-button">Settings</button>
            </div>
            <button @click="closeChat" class="minimize-button">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.5 0.5L0.5 11.5M0.5 0.5L11.5 11.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <Transition name="fade">
            <div v-if="settingsMenu" class="chat-subHeader">
              <div class="user-section">
                <div v-if="getOptions()?.userChangeNick" class="user-name-input">
                  <div v-if="!editMode">
                    <span>{{ getMyName() }}</span>
                    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg"
                      @click="enterEditMode">
                      <path
                        d="M7 12.3333H13M10 1.33334C10.2652 1.06813 10.6249 0.919128 11 0.919128C11.1857 0.919128 11.3696 0.955708 11.5412 1.02678C11.7128 1.09785 11.8687 1.20202 12 1.33334C12.1313 1.46466 12.2355 1.62057 12.3066 1.79215C12.3776 1.96373 12.4142 2.14762 12.4142 2.33334C12.4142 2.51906 12.3776 2.70296 12.3066 2.87454C12.2355 3.04612 12.1313 3.20202 12 3.33334L3.66667 11.6667L1 12.3333L1.66667 9.66668L10 1.33334Z"
                        stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </div>
                  <div v-else>
                    <input v-model="editedUserName" @keypress.enter="saveEditedUserName" class="edit-user-input" />
                    <button class="change-name-btn" @click="saveEditedUserName">OK</button>
                    <button class="cancel-change-name-btn" @click="exitEditMode">Cancel</button>
                  </div>
                </div>
                <div v-else>
                  <span>{{ getMyName() }}</span>
                </div>
              </div>
              <div v-if="showSystemMessages" class="system-message-section">
                <input id="showSystemMEssages" type="checkbox" v-model="userShowSystemMessages">
                <label for="showSystemMEssages">Show system messages</label>
              </div>
            </div>
          </Transition>
          <div class="chat-body" ref="messageContainerRef">
            <TransitionGroup name="fade">
              <div v-for="(groupedMsgs, idGroup) in groupedMessages" :key="groupedMsgs[0].id"
                :class="{ 'own-message': groupedMsgs[0].author.id === getMyID() }" class="message-container"
                :id="groupedMsgs[0].id">
                <Transition name="fade">
                  <span v-if="groupedMsgs[0].type === 'text' && checkPreviousMsgName(idGroup)" class="user-name-baloon">
                    {{ groupedMsgs[0].author.name }}
                  </span>
                </Transition>
                <TransitionGroup name="fade">
                  <div v-if="groupedMsgs[0].responseTo && groupedResponse(groupedMsgs[0].responseTo).length <= 0"
                    class="grouped-message grouped-response response-disabled">
                    <div class="message">
                      <div class="message-content">unloaded message</div>
                    </div>
                  </div>
                  <div v-else-if="groupedMsgs[0].responseTo" class="grouped-message grouped-response">
                    <div class="message" @click="scrollToMessage(groupedMsgs[0].responseTo)">
                      <div v-for="(message, idMsg) in groupedResponse(groupedMsgs[0].responseTo).slice(0, 4)"
                        :key="idMsg" class="message-content">{{
                          message.data
                        }}
                      </div>
                      <div v-if="groupedResponse(groupedMsgs[0].responseTo).length > 4" class="message-content">...
                      </div>
                    </div>
                  </div>
                </TransitionGroup>
                <Transition name="fade">
                  <div v-if="groupedMsgs[0].type === 'text'" class="grouped-message">
                    <button v-if="groupedMsgs[0].author.id === getMyID()" @click="setResponse(idGroup)">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M 14.877 1.132 C 14.877 6.404 13.841 8.878 11.608 10.035 C 9.374 11.191 5.944 11.029 1.155 11.029 M 1.155 11.029 C 1.869 10.395 2.584 9.76 3.299 9.126 C 4.014 8.491 4.728 7.857 5.443 7.222 M 1.155 11.029 C 1.869 11.664 2.584 12.298 3.299 12.933 C 4.014 13.567 4.728 14.202 5.443 14.836"
                          stroke-linecap="round" stroke-linejoin="round"
                          style="stroke-width: 2px; transform-origin: 8.016px 7.984px;"></path>
                      </svg>
                    </button>
                    <button v-if="!messageReacted(groupedMsgs[0].id) && groupedMsgs[0].author.id === getMyID()" @click="reactMessage(idGroup, 'like')">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M 15.364 8.138 L 14.758 8.042 L 15.364 8.138 Z M 14.786 11.174 L 14.179 11.079 L 14.786 11.174 Z M 3.847 14.308 L 3.234 14.357 L 3.847 14.308 Z M 3.18 7.318 L 3.793 7.271 L 3.18 7.318 Z M 9.637 2.955 L 10.244 3.046 L 9.637 2.955 Z M 9.093 5.965 L 9.7 6.055 L 9.093 5.965 Z M 3.65 6.271 L 3.248 5.849 L 3.65 6.271 Z M 4.83 5.349 L 5.232 5.772 L 4.83 5.349 Z M 6.784 2.63 L 6.188 2.489 L 6.784 2.63 Z M 7.175 1.265 L 7.77 1.405 L 7.175 1.265 Z M 8.548 0.606 L 8.359 1.137 L 8.548 0.606 Z M 8.667 0.641 L 8.855 0.109 L 8.667 0.641 Z M 6.246 3.879 L 6.788 4.142 L 6.246 3.879 Z M 9.563 1.487 L 8.967 1.627 L 9.563 1.487 Z M 7.733 0.656 L 7.466 0.154 L 7.733 0.656 Z M 1.413 15.048 L 0.799 15.096 L 1.413 15.048 Z M 0.615 6.686 L 1.228 6.638 C 1.2 6.34 0.918 6.116 0.589 6.128 C 0.259 6.141 0 6.387 0 6.686 L 0.615 6.686 Z M 14.758 8.042 L 14.179 11.079 L 15.392 11.269 L 15.971 8.233 L 14.758 8.042 Z M 9.022 14.884 L 5.207 14.884 L 5.207 16 L 9.022 16 L 9.022 14.884 Z M 4.46 14.26 L 3.793 7.271 L 2.567 7.367 L 3.234 14.357 L 4.46 14.26 Z M 14.179 11.079 C 13.763 13.26 11.595 14.884 9.022 14.884 L 9.022 16 C 12.161 16 14.869 14.014 15.392 11.269 L 14.179 11.079 Z M 9.03 2.865 L 8.486 5.875 L 9.7 6.055 L 10.244 3.046 L 9.03 2.865 Z M 4.052 6.695 L 5.232 5.772 L 4.428 4.926 L 3.248 5.849 L 4.052 6.695 Z M 7.38 2.77 L 7.77 1.405 L 6.579 1.125 L 6.188 2.489 L 7.38 2.77 Z M 8.359 1.137 L 8.478 1.172 L 8.855 0.109 L 8.736 0.074 L 8.359 1.137 Z M 6.788 4.142 C 7.044 3.707 7.244 3.247 7.38 2.77 L 6.188 2.489 C 6.077 2.881 5.913 3.259 5.703 3.616 L 6.788 4.142 Z M 8.478 1.172 C 8.73 1.245 8.908 1.421 8.967 1.627 L 10.159 1.346 C 9.99 0.757 9.493 0.295 8.855 0.109 L 8.478 1.172 Z M 7.77 1.405 C 7.799 1.304 7.879 1.212 8 1.159 L 7.466 0.154 C 7.029 0.344 6.701 0.696 6.579 1.125 L 7.77 1.405 Z M 8 1.159 C 8.11 1.111 8.24 1.103 8.359 1.137 L 8.736 0.074 C 8.318 -0.047 7.861 -0.019 7.466 0.154 L 8 1.159 Z M 9.767 7.244 L 14.019 7.244 L 14.019 6.128 L 9.767 6.128 L 9.767 7.244 Z M 2.026 15 L 1.228 6.638 L 0.002 6.734 L 0.799 15.096 L 2.026 15 Z M 1.231 15.079 L 1.231 6.686 L 0 6.686 L 0 15.079 L 1.231 15.079 Z M 0.799 15.096 C 0.789 14.983 0.887 14.884 1.015 14.884 L 1.015 16 C 1.611 16 2.077 15.537 2.026 15 L 0.799 15.096 Z M 10.244 3.046 C 10.347 2.48 10.317 1.901 10.159 1.346 L 8.967 1.627 C 9.083 2.031 9.104 2.453 9.03 2.865 L 10.244 3.046 Z M 5.207 14.884 C 4.818 14.884 4.493 14.614 4.46 14.26 L 3.234 14.357 C 3.321 15.286 4.179 16 5.207 16 L 5.207 14.884 Z M 5.232 5.772 C 5.79 5.336 6.391 4.817 6.788 4.142 L 5.703 3.616 C 5.419 4.099 4.966 4.506 4.428 4.926 L 5.232 5.772 Z M 15.971 8.233 C 16.18 7.134 15.248 6.128 14.019 6.128 L 14.019 7.244 C 14.483 7.244 14.837 7.625 14.758 8.042 L 15.971 8.233 Z M 1.015 14.884 C 1.135 14.884 1.231 14.972 1.231 15.079 L 0 15.079 C 0 15.587 0.454 16 1.015 16 L 1.015 14.884 Z M 8.486 5.875 C 8.356 6.592 8.966 7.244 9.767 7.244 L 9.767 6.128 C 9.726 6.128 9.694 6.094 9.7 6.055 L 8.486 5.875 Z M 3.793 7.271 C 3.772 7.052 3.869 6.838 4.052 6.695 L 3.248 5.849 C 2.765 6.226 2.512 6.791 2.567 7.367 L 3.793 7.271 Z">
                        </path>
                      </svg>
                    </button>
                    <div class="message">
                      <TransitionGroup name="fade">
                        <div v-for="(message, idxMsg) in groupedMsgs" class="message-content" :key="idxMsg">
                          {{ message.data }}
                        </div>
                        <div v-for="(msgReact, idxReact) in getMessageReactions(groupedMsgs[0].id)"
                          class="message-react" :key="idxReact">
                          <button v-if="msgReact.reaction === 'like'" @click="reactMessage(idGroup, 'none')">
                            {{ msgReact.quantity }}
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M 15.364 8.138 L 14.758 8.042 L 15.364 8.138 Z M 14.786 11.174 L 14.179 11.079 L 14.786 11.174 Z M 3.847 14.308 L 3.234 14.357 L 3.847 14.308 Z M 3.18 7.318 L 3.793 7.271 L 3.18 7.318 Z M 9.637 2.955 L 10.244 3.046 L 9.637 2.955 Z M 9.093 5.965 L 9.7 6.055 L 9.093 5.965 Z M 3.65 6.271 L 3.248 5.849 L 3.65 6.271 Z M 4.83 5.349 L 5.232 5.772 L 4.83 5.349 Z M 6.784 2.63 L 6.188 2.489 L 6.784 2.63 Z M 7.175 1.265 L 7.77 1.405 L 7.175 1.265 Z M 8.548 0.606 L 8.359 1.137 L 8.548 0.606 Z M 8.667 0.641 L 8.855 0.109 L 8.667 0.641 Z M 6.246 3.879 L 6.788 4.142 L 6.246 3.879 Z M 9.563 1.487 L 8.967 1.627 L 9.563 1.487 Z M 7.733 0.656 L 7.466 0.154 L 7.733 0.656 Z M 1.413 15.048 L 0.799 15.096 L 1.413 15.048 Z M 0.615 6.686 L 1.228 6.638 C 1.2 6.34 0.918 6.116 0.589 6.128 C 0.259 6.141 0 6.387 0 6.686 L 0.615 6.686 Z M 14.758 8.042 L 14.179 11.079 L 15.392 11.269 L 15.971 8.233 L 14.758 8.042 Z M 9.022 14.884 L 5.207 14.884 L 5.207 16 L 9.022 16 L 9.022 14.884 Z M 4.46 14.26 L 3.793 7.271 L 2.567 7.367 L 3.234 14.357 L 4.46 14.26 Z M 14.179 11.079 C 13.763 13.26 11.595 14.884 9.022 14.884 L 9.022 16 C 12.161 16 14.869 14.014 15.392 11.269 L 14.179 11.079 Z M 9.03 2.865 L 8.486 5.875 L 9.7 6.055 L 10.244 3.046 L 9.03 2.865 Z M 4.052 6.695 L 5.232 5.772 L 4.428 4.926 L 3.248 5.849 L 4.052 6.695 Z M 7.38 2.77 L 7.77 1.405 L 6.579 1.125 L 6.188 2.489 L 7.38 2.77 Z M 8.359 1.137 L 8.478 1.172 L 8.855 0.109 L 8.736 0.074 L 8.359 1.137 Z M 6.788 4.142 C 7.044 3.707 7.244 3.247 7.38 2.77 L 6.188 2.489 C 6.077 2.881 5.913 3.259 5.703 3.616 L 6.788 4.142 Z M 8.478 1.172 C 8.73 1.245 8.908 1.421 8.967 1.627 L 10.159 1.346 C 9.99 0.757 9.493 0.295 8.855 0.109 L 8.478 1.172 Z M 7.77 1.405 C 7.799 1.304 7.879 1.212 8 1.159 L 7.466 0.154 C 7.029 0.344 6.701 0.696 6.579 1.125 L 7.77 1.405 Z M 8 1.159 C 8.11 1.111 8.24 1.103 8.359 1.137 L 8.736 0.074 C 8.318 -0.047 7.861 -0.019 7.466 0.154 L 8 1.159 Z M 9.767 7.244 L 14.019 7.244 L 14.019 6.128 L 9.767 6.128 L 9.767 7.244 Z M 2.026 15 L 1.228 6.638 L 0.002 6.734 L 0.799 15.096 L 2.026 15 Z M 1.231 15.079 L 1.231 6.686 L 0 6.686 L 0 15.079 L 1.231 15.079 Z M 0.799 15.096 C 0.789 14.983 0.887 14.884 1.015 14.884 L 1.015 16 C 1.611 16 2.077 15.537 2.026 15 L 0.799 15.096 Z" />
                            </svg>
                          </button>
                        </div>
                      </TransitionGroup>
                    </div>
                    <Transition name="fade">
                      <button v-if="groupedMsgs[0].author.id !== getMyID()" @click="setResponse(idGroup)">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M 14.877 1.132 C 14.877 6.404 13.841 8.878 11.608 10.035 C 9.374 11.191 5.944 11.029 1.155 11.029 M 1.155 11.029 C 1.869 10.395 2.584 9.76 3.299 9.126 C 4.014 8.491 4.728 7.857 5.443 7.222 M 1.155 11.029 C 1.869 11.664 2.584 12.298 3.299 12.933 C 4.014 13.567 4.728 14.202 5.443 14.836"
                            stroke-linecap="round" stroke-linejoin="round"
                            style="stroke-width: 2px; transform-origin: 8.016px 7.984px;">
                          </path>
                        </svg>
                      </button>
                      <button v-if="!messageReacted(groupedMsgs[0].id) && groupedMsgs[0].author.id !== getMyID()" @click="reactMessage(idGroup, 'like')">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M 15.364 8.138 L 14.758 8.042 L 15.364 8.138 Z M 14.786 11.174 L 14.179 11.079 L 14.786 11.174 Z M 3.847 14.308 L 3.234 14.357 L 3.847 14.308 Z M 3.18 7.318 L 3.793 7.271 L 3.18 7.318 Z M 9.637 2.955 L 10.244 3.046 L 9.637 2.955 Z M 9.093 5.965 L 9.7 6.055 L 9.093 5.965 Z M 3.65 6.271 L 3.248 5.849 L 3.65 6.271 Z M 4.83 5.349 L 5.232 5.772 L 4.83 5.349 Z M 6.784 2.63 L 6.188 2.489 L 6.784 2.63 Z M 7.175 1.265 L 7.77 1.405 L 7.175 1.265 Z M 8.548 0.606 L 8.359 1.137 L 8.548 0.606 Z M 8.667 0.641 L 8.855 0.109 L 8.667 0.641 Z M 6.246 3.879 L 6.788 4.142 L 6.246 3.879 Z M 9.563 1.487 L 8.967 1.627 L 9.563 1.487 Z M 7.733 0.656 L 7.466 0.154 L 7.733 0.656 Z M 1.413 15.048 L 0.799 15.096 L 1.413 15.048 Z M 0.615 6.686 L 1.228 6.638 C 1.2 6.34 0.918 6.116 0.589 6.128 C 0.259 6.141 0 6.387 0 6.686 L 0.615 6.686 Z M 14.758 8.042 L 14.179 11.079 L 15.392 11.269 L 15.971 8.233 L 14.758 8.042 Z M 9.022 14.884 L 5.207 14.884 L 5.207 16 L 9.022 16 L 9.022 14.884 Z M 4.46 14.26 L 3.793 7.271 L 2.567 7.367 L 3.234 14.357 L 4.46 14.26 Z M 14.179 11.079 C 13.763 13.26 11.595 14.884 9.022 14.884 L 9.022 16 C 12.161 16 14.869 14.014 15.392 11.269 L 14.179 11.079 Z M 9.03 2.865 L 8.486 5.875 L 9.7 6.055 L 10.244 3.046 L 9.03 2.865 Z M 4.052 6.695 L 5.232 5.772 L 4.428 4.926 L 3.248 5.849 L 4.052 6.695 Z M 7.38 2.77 L 7.77 1.405 L 6.579 1.125 L 6.188 2.489 L 7.38 2.77 Z M 8.359 1.137 L 8.478 1.172 L 8.855 0.109 L 8.736 0.074 L 8.359 1.137 Z M 6.788 4.142 C 7.044 3.707 7.244 3.247 7.38 2.77 L 6.188 2.489 C 6.077 2.881 5.913 3.259 5.703 3.616 L 6.788 4.142 Z M 8.478 1.172 C 8.73 1.245 8.908 1.421 8.967 1.627 L 10.159 1.346 C 9.99 0.757 9.493 0.295 8.855 0.109 L 8.478 1.172 Z M 7.77 1.405 C 7.799 1.304 7.879 1.212 8 1.159 L 7.466 0.154 C 7.029 0.344 6.701 0.696 6.579 1.125 L 7.77 1.405 Z M 8 1.159 C 8.11 1.111 8.24 1.103 8.359 1.137 L 8.736 0.074 C 8.318 -0.047 7.861 -0.019 7.466 0.154 L 8 1.159 Z M 9.767 7.244 L 14.019 7.244 L 14.019 6.128 L 9.767 6.128 L 9.767 7.244 Z M 2.026 15 L 1.228 6.638 L 0.002 6.734 L 0.799 15.096 L 2.026 15 Z M 1.231 15.079 L 1.231 6.686 L 0 6.686 L 0 15.079 L 1.231 15.079 Z M 0.799 15.096 C 0.789 14.983 0.887 14.884 1.015 14.884 L 1.015 16 C 1.611 16 2.077 15.537 2.026 15 L 0.799 15.096 Z M 10.244 3.046 C 10.347 2.48 10.317 1.901 10.159 1.346 L 8.967 1.627 C 9.083 2.031 9.104 2.453 9.03 2.865 L 10.244 3.046 Z M 5.207 14.884 C 4.818 14.884 4.493 14.614 4.46 14.26 L 3.234 14.357 C 3.321 15.286 4.179 16 5.207 16 L 5.207 14.884 Z M 5.232 5.772 C 5.79 5.336 6.391 4.817 6.788 4.142 L 5.703 3.616 C 5.419 4.099 4.966 4.506 4.428 4.926 L 5.232 5.772 Z M 15.971 8.233 C 16.18 7.134 15.248 6.128 14.019 6.128 L 14.019 7.244 C 14.483 7.244 14.837 7.625 14.758 8.042 L 15.971 8.233 Z M 1.015 14.884 C 1.135 14.884 1.231 14.972 1.231 15.079 L 0 15.079 C 0 15.587 0.454 16 1.015 16 L 1.015 14.884 Z M 8.486 5.875 C 8.356 6.592 8.966 7.244 9.767 7.244 L 9.767 6.128 C 9.726 6.128 9.694 6.094 9.7 6.055 L 8.486 5.875 Z M 3.793 7.271 C 3.772 7.052 3.869 6.838 4.052 6.695 L 3.248 5.849 C 2.765 6.226 2.512 6.791 2.567 7.367 L 3.793 7.271 Z">
                        </path>
                      </svg>
                    </button>
                    </Transition>
                  </div>
                  <div v-else-if="showSystemMessages && userShowSystemMessages && groupedMsgs[0].type === 'system'"
                    class="system-message">
                    <TransitionGroup name="fade">
                      <div v-for="(message, idMsg) in groupedMsgs" class="message-content" :key="idMsg">{{
                        printSystemMessage(message)
                      }}
                      </div>
                    </TransitionGroup>
                  </div>
                </Transition>
                <Transition name="fade">
                  <div v-if="groupedMsgs[0].type === 'text'" class="timestamp">
                    {{ formatTimestamp(groupedMsgs[groupedMsgs.length - 1].timestamp) }}
                  </div>
                </Transition>
              </div>
            </TransitionGroup>
          </div>
          <div class="chat-footer">
            <Transition name="fade">
              <div v-if="responseTo !== undefined" class="response-input">
                <div>
                  <TransitionGroup name="fade">
                    <div v-for="(message, idMsg) in groupedMessages[responseTo].slice(0, 4)" :key="idMsg">{{
                      message.data
                    }}
                    </div>
                    <div v-if="groupedMessages[responseTo].length > 4">...</div>
                  </TransitionGroup>
                </div>
                <button @click="setResponse(undefined)">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.5 0.5L0.5 11.5M0.5 0.5L11.5 11.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </Transition>
            <div class="message-input">
              <input v-model="messageInput" placeholder="Type your message..." @keypress.enter="handleSendMessage"
                :disabled="loadingRoom" />
              <button @click="handleSendMessage" class="send-button" :disabled="loadingRoom || !messageInput">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="current">
                  <path
                    d="M20.3534 10.9267C21.2378 11.3689 21.2378 12.6311 20.3534 13.0733L4.61964 20.9402C3.59859 21.4507 2.50875 20.3816 2.99955 19.351L6.25432 12.5159C6.40974 12.1895 6.40974 11.8105 6.25432 11.4841L2.99955 4.64905C2.50875 3.61837 3.59859 2.54929 4.61964 3.05982L20.3534 10.9267Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Transition>
      <Transition name="fastFade" mode="out-in">
        <button v-if="!isChatOpen" @click="openChat" class="open-button">
          <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
              stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </Transition>
    </div>
    <div v-else-if="getStatus() === 'connecting'" class="spinner" key="conecting">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.4" stroke-width="4" />
        <path
          d="M12 22C10.6868 22 9.38642 21.7413 8.17317 21.2388C6.95991 20.7362 5.85752 19.9997 4.92893 19.0711C4.00035 18.1425 3.26375 17.0401 2.7612 15.8268C2.25866 14.6136 2 13.3132 2 12"
          stroke-opacity="0.8" stroke-width="4" />
        <path
          d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.76121C17.0401 3.26375 18.1425 4.00035 19.0711 4.92894C19.9997 5.85752 20.7363 6.95992 21.2388 8.17317C21.7413 9.38643 22 10.6868 22 12"
          stroke-opacity="0.8" stroke-width="4" />
      </svg>
    </div>
    <div v-else key="disconnected">
      <button @click="openChat" class="load-button">
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
            stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </div>
</template>