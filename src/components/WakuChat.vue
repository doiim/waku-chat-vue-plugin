<script setup lang="ts">
import { ref, onMounted, watchEffect, onBeforeUnmount, defineProps } from "vue";
import { Message, WakuChatConfigCss } from "../types/ChatTypes";
import {
  sendMessage,
  loadChat,
  setRoom,
  getParticipants,
  getStatus,
  getMessageList,
  getRoom,
  setMyName,
  getMyName,
  setMyID,
  getMyID,
  getOptions,
  onDestroyWaku
} from "../components/WakuLogic"

const props = defineProps<{
  externalUserId: string | undefined;
}>()

const isChatOpen = ref<boolean>(false);

const messageFiltered = ref<Message[]>([]);
const messageInput = ref<string>('');

const computedCss = ref<WakuChatConfigCss>({
  colors: {
    header: {
      main: 'rgba(219, 234, 254, 1)',
      text: 'rgba(107, 114, 128, 1)',
      textHover: 'rgba(37, 99, 235, 1)',
    },
    room: {
      btn: {
        text: 'rgba(31, 41, 55, 1)',
        textHover: 'rgba(37, 99, 235, 1)',
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
      textHover: 'rgba(37, 99, 235, 1)',
    },
    loadBtn: {
      main: 'rgba(37, 99, 235, 1)',
      hover: 'rgba(59, 130, 246,1)',
      text: 'rgba(249, 250, 251, 1)',
      textHover: 'rgba(37, 99, 235, 1)',
    },
    loadingBtn: {
      main: 'rgba(37, 99, 235, 1)',
      text: 'rgba(249, 250, 251, 1)',
    },
    openBtn: {
      main: 'rgba(37, 99, 235, 1)',
      hover: 'rgba(59, 130, 246,1)',
      text: 'rgba(249, 250, 251, 1)',
      textHover: 'rgba(37, 99, 235, 1)',
    },
    sendBtn: {
      main: 'rgba(37, 99, 235, 1)',
      hover: 'rgba(59, 130, 246,1)',
      text: 'rgba(249, 250, 251, 1)',
      textHover: 'rgba(37, 99, 235, 1)',
    },
    input: {
      main: 'rgba(229, 231, 235, 1)',
      placeholder: 'rgba(156, 163, 175, 1)',
      text: 'rgba(31, 41, 55, 1)'
    },
    minimizeBtn: {
      main: 'rgba(107, 114, 128, 1)',
      hover: 'rgba(37, 99, 235, 1)',
    },
    chat: {
      myMessage: {
        main: 'rgba(37, 99, 235, 1)',
        text: 'rgba(249, 250, 251, 1)',
      },
      otherMessage: {
        main: 'rgba(229, 231, 235, 1)',
        text: 'rgba(31, 41, 55, 1)',
      },
      timestamp: 'rgba(156, 163, 175, 1)',
    },
    background: 'rgba(249, 250, 251, 1)',
    border: 'rgba(37, 99, 235, 1)',
  }
});

const editMode = ref(false);
const editedUserName = ref('');

const messageContainerRef = ref<HTMLElement | null>(null);

onMounted(() => {
  const handleNickNameChange = (event: Event) => {
    const newNick = (event as CustomEvent).detail;

    if (getOptions()?.changeNickMode === 'message' || getOptions()?.changeNickMode === 'interface') {
      setMyName(newNick);
    }
  };
  //document.dispatchEvent(new CustomEvent('changeNickName', { detail: 'newNick' }));
  document.addEventListener('changeNickName', handleNickNameChange);

  onBeforeUnmount(() => {
    document.removeEventListener('changeNickName', handleNickNameChange);
    onDestroyWaku();
  });
});

const enterEditMode = () => {
  editMode.value = true;
};
const exitEditMode = () => {
  editMode.value = false;
};

const saveEditedUserName = () => {
  setMyName(editedUserName.value);
  exitEditMode();
};

const getRoomName = (room: string) => {
  let name = getOptions()?.availableRooms[0];
  getParticipants().forEach(participant => {
    name = room.replace(new RegExp(participant.id, 'g'), participant.name);
  });
  return name;
};

const changeRoomDropdown = (selectedRoom: string) => {
  setRoom(selectedRoom);
};

const openChat = async () => {
  if (getStatus() !== "connected") {
    await loadChat()
    if (props.externalUserId) {
      setMyID(props.externalUserId)
    }
    editedUserName.value = getMyName();
  }
  isChatOpen.value = true
}

const closeChat = () => {
  isChatOpen.value = false
}

const handleSendMessage = () => {
  sendMessage({ text: messageInput.value }, 'text')
  messageInput.value = ''
}

const scrollToBottom = () => {
  if (messageContainerRef.value) {
    const container = messageContainerRef.value
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 100);
  }
};

watchEffect(() => {
  if (props.externalUserId) {
    setMyID(props.externalUserId)
  }
});

watchEffect(() => {
  messageFiltered.value = getMessageList().filter(message => {
    return message.room === getRoom();
  })
  if (messageFiltered.value.length > 0)
    scrollToBottom();
});

function mergeObjects(target: any, source: any) {
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

watchEffect(() => {
  const options = getOptions();
  const colorConfig = options?.cssConfig as Record<string, any> | undefined;;

  if (!colorConfig) return;

  mergeObjects(computedCss.value, colorConfig);
});

</script>

<template>
  <div v-if="getStatus() === 'connected'">
    <div v-if="isChatOpen" class="chat-container" :class="{ 'open': isChatOpen }">
      <div class="chat-header">
        <div class="room-section">
          <div class="room-info">
            Room
          </div>
          <div class="room-dropdown">
            <button class="dropdown-button">{{ getRoomName(getRoom()) }}</button>
            <div class="dropdown-content">
              <div v-for="availableRoom in getOptions()?.availableRooms" :key="availableRoom">
                <button @click="changeRoomDropdown(availableRoom)">
                  {{ availableRoom }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="settings-section">
          <div>Settings</div>
          <button @click="closeChat" class="minimize-button">-</button>
        </div>
      </div>
      <div class="chat-subHeader">
        <div class="user-section">
          <div v-if="getOptions()?.changeNickMode === 'interface'" class="user-profile" @click="enterEditMode">
            <span v-if="!editMode">{{ getMyName() }}</span>
            <input v-model="editedUserName" v-else @blur="exitEditMode" @keypress.enter="saveEditedUserName"
              class="edit-user-input" />
          </div>
          <div v-else class="user-profile non-edit">
            <span>{{ getMyName() }}</span>
          </div>
        </div>
      </div>
      <div class="chat-body" ref="messageContainerRef">
        <div v-for="message in messageFiltered" :key="message.id"
          :class="{ 'own-message': message.author.id === getMyID() }" class="message-container">
          <span class="user-name-baloon">
            {{ message.author.name }}
          </span>
          <div class="message">
            <div class="message-content">{{ message.data.text }}</div>
          </div>
          <div class="timestamp">
            <span>
              {{ (new Date(message.timestamp)).toLocaleTimeString() }}
            </span>
          </div>
        </div>
      </div>
      <div class="chat-footer">
        <input v-model="messageInput" class="message-input" placeholder="Type your message..."
          @keypress.enter="handleSendMessage" />
        <button @click="handleSendMessage" class="send-button">Send</button>
      </div>
    </div>
    <button v-else @click="openChat" class="open-button">Open Chat</button>
  </div>
  <div v-else-if="getStatus() === 'connecting'" class="spinner">
    <div></div>
  </div>
  <div v-else>
    <button @click="openChat" class="open-button">Load Chat</button>
  </div>
</template>

<style lang="css" scoped>
.room-dropdown {
  position: relative;
  display: inline-block;
}

.room-dropdown:hover .dropdown-content {
  display: block;
}

.dropdown-content {
  display: none;
  right: 0;
  position: absolute;
  background-color: v-bind('computedCss.colors.room.dropdown.main');
  min-width: 100%;
  z-index: 1;
  max-width: 256px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 16px;
}

.dropdown-content button {
  color: v-bind('computedCss.colors.room.dropdown.text');
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  cursor: pointer;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  transition: background-color 0.3s ease-in-out;
  border-radius: 16px;
}

.dropdown-content button:hover {
  background-color: v-bind('computedCss.colors.room.dropdown.hover');
}

.dropdown-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: v-bind('computedCss.colors.room.btn.text');
}

.dropdown-button:hover {
  color: v-bind('computedCss.colors.room.btn.textHover');
}

.chat-container {
  width: 368px;
  height: 592px;
  position: fixed;
  bottom: 16px;
  right: 16px;
  background-color: v-bind('computedCss.colors.background');
  border: 2px solid v-bind('computedCss.colors.border');
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease-in-out;
}

.chat-container.open {
  transform: translateY(0);
}

.chat-header {
  background-color: v-bind('computedCss.colors.header.main');
  color: v-bind('computedCss.colors.header.text');
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.settings-section {
  display: flex;
}

.user-section {
  display: flex;
  width: 100%;
  justify-content: space-between;
  margin-bottom: 8px;
}

.room-section {
  display: flex;
  width: 100%;
}

.chat-subHeader {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0px 8px;
  width: 100%;
  background-color: v-bind('computedCss.colors.subHeader.main');
  color: v-bind('computedCss.colors.subHeader.text');
}

.non-edit {
  cursor: default;
}

.edit-user-input {
  font-size: 14px;
  border-radius: 16px;
  margin: 4px 0px;
  height: 38px;
  width: 100%;
}

.room-info {
  margin-right: 10px;
}

.room-name {
  font-size: 14px;
  font-weight: bold;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.chat-footer {
  display: flex;
  align-items: center;
  padding: 16px;
}

.message-input {
  font-size: 18px;
  flex: 1;
  height: 32px;
  padding: 16px;
  color: v-bind('computedCss.colors.input.text');
  background-color: v-bind('computedCss.colors.input.main');
  border-radius: 16px;
}

.open-button,
.spinner,
.minimize-button,
.send-button {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  transition: background-color 0.3s ease-in-out;
  display: flex;
  justify-content: center;
  align-items: center;
}

.open-button,
.minimize-button,
.send-button {
  cursor: pointer;
}

.open-button,
.spinner {
  position: fixed;
  right: 34px;
  bottom: 36px;
}

.load-button {
  background-color: v-bind('computedCss.colors.loadBtn.main');
  color: v-bind('computedCss.colors.loadBtn.text');
}

.load-button:hover {
  background-color: v-bind('computedCss.colors.loadBtn.hover');
  color: v-bind('computedCss.colors.loadBtn.textHover');
}

.open-button {
  background-color: v-bind('computedCss.colors.openBtn.main');
  color: v-bind('computedCss.colors.openBtn.text');
}

.open-button:hover {
  background-color: v-bind('computedCss.colors.openBtn.hover');
  color: v-bind('computedCss.colors.openBtn.textHover');
}

.spinner {
  background-color: v-bind('computedCss.colors.loadingBtn.main');
  color: v-bind('computedCss.colors.loadingBtn.text');
}

.minimize-button {
  width: 32px;
  height: 32px;
  background-color: v-bind('computedCss.colors.minimizeBtn.main');
}

.minimize-button:hover {
  background-color: v-bind('computedCss.colors.minimizeBtn.hover');
}

.send-button {
  background-color: v-bind('computedCss.colors.sendBtn.main');
  color: v-bind('computedCss.colors.sendBtn.text');
}

.send-button:hover {
  background-color: v-bind('computedCss.colors.sendBtn.hover');
  color: v-bind('computedCss.colors.sendBtn.textHover');
}

.spinner div {
  width: 16px;
  height: 16px;
  border: 4px solid v-bind('computedCss.colors.loadingBtn.text');
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.own-message .user-name-baloon {
  color: v-bind('computedCss.colors.chat.myMessage.main');
}

.own-message div {
  align-self: end;
}

.own-message .message {
  background-color: v-bind('computedCss.colors.chat.myMessage.main');
  color: v-bind('computedCss.colors.chat.myMessage.text');
  align-self: end;
}

.own-message .timestamp {
  align-self: end;
}

.own-message .user-name-baloon {
  align-self: end;
}

.user-name-baloon {
  color: v-bind('computedCss.colors.chat.otherMessage.main');
}

.message-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.message-container div {
  align-self: start;
}

.message {
  min-width: 96px;
  max-width: 67%;
  padding: 10px;
  border-radius: 8px;
  background-color: v-bind('computedCss.colors.chat.otherMessage.main');
  color: v-bind('computedCss.colors.chat.otherMessage.text');
}

.timestamp {
  font-size: 12px;
  color: v-bind('computedCss.colors.chat.timestamp');
}

.message-content {
  word-wrap: break-word;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>