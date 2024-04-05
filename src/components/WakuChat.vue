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
const settingsMenu = ref<boolean>(false);
const loadingRoom = ref<boolean>(false);

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
      editName: {
        main: 'rgba(229, 231, 235, 1)',
        placeholder: 'rgba(156, 163, 175, 1)',
        text: 'rgba(31, 41, 55, 1)',
        disabled: 'rgba(229, 231, 235, 1)',
      }
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
      disabled: 'rgba(75, 85, 99, 1)',
    },
    input: {
      main: 'rgba(229, 231, 235, 1)',
      placeholder: 'rgba(156, 163, 175, 1)',
      text: 'rgba(31, 41, 55, 1)',
      disabled: 'rgba(229, 231, 235, 1)',
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

    if (getOptions()?.changeNickMode === 'application' || getOptions()?.changeNickMode === 'user') {
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
  exitEditMode()
};

const getRoomName = (room: string) => {
  let name = getOptions()?.availableRooms[0];
  getParticipants().forEach(participant => {
    name = room.replace(new RegExp(participant.id, 'g'), participant.name);
  });
  return name;
};

const changeRoomDropdown = async (selectedRoom: string) => {
  loadingRoom.value = true
  await setRoom(selectedRoom);
  loadingRoom.value = false
};

const openChat = async () => {
  if (getStatus() !== "connected") {
    await loadChat()
    if (props.externalUserId) {
      setMyID(props.externalUserId)
    }
  }
  isChatOpen.value = true
}

const closeChat = () => {
  isChatOpen.value = false
}

const handleSendMessage = () => {
  if (messageInput.value)
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
  editedUserName.value = getMyName()
});

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

const checkPreviousMsgName = (idx: number) => {
  return !(idx > 0 && messageFiltered.value[idx].author.id === messageFiltered.value[idx - 1].author.id &&
    messageFiltered.value[idx].author.name === messageFiltered.value[idx - 1].author.name)
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
            <button class="dropdown-button">
              <div>{{ getRoomName(getRoom()) }}</div>
              <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6.5L8 10.5L12 6.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <div class="dropdown-content">
              <div v-for="availableRoom in getOptions()?.availableRooms" :key="availableRoom">
                <button :class="availableRoom === getRoom() ? 'selected' : ''"
                  @click="changeRoomDropdown(availableRoom)">
                  {{ availableRoom }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="settings-section">
          <button @click="settingsMenu = !settingsMenu" class="settings-button">Settings</button>
          <button @click="closeChat" class="minimize-button">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.5 0.5L0.5 11.5M0.5 0.5L11.5 11.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <div v-show="settingsMenu" class="chat-subHeader">
        <div class="user-section">
          <div v-if="getOptions()?.changeNickMode === 'user'" class="user-name-input">
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
              <input v-model="editedUserName" @keypress.enter="saveEditedUserName"
                class="edit-user-input" />
              <button class="change-name-btn" @click="saveEditedUserName">OK</button>
              <button class="cancel-change-name-btn" @click="exitEditMode">Cancel</button>
            </div>
          </div>
          <div v-else>
            <span>{{ getMyName() }}</span>
          </div>
        </div>
      </div>
      <div class="chat-body" ref="messageContainerRef">
        <div v-for="(message, idx) in messageFiltered" :key="message.id"
          :class="{ 'own-message': message.author.id === getMyID() }" class="message-container">
          <span v-show="checkPreviousMsgName(idx)" class="user-name-baloon">
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
    <button v-else @click="openChat" class="open-button">
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
          stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </div>
  <div v-else-if="getStatus() === 'connecting'" class="spinner">
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
  <div v-else>
    <button @click="openChat" class="load-button">
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
          stroke-linecap="round" stroke-linejoin="round" />
      </svg>

    </button>
  </div>
</template>

<style lang="css" scoped>
.user-name-input {
  width: 100%;
}

.user-name-input input {
  width: fit-content;
  max-width: 50%;
  outline: none;
  font-size: 14px;
  padding-left: 8px;
  color: v-bind('computedCss.colors.subHeader.editName.text');
  background-color: v-bind('computedCss.colors.subHeader.editName.main');
}

.user-name-input svg {
  cursor: pointer;
  stroke: v-bind('computedCss.colors.subHeader.editName.text');
  margin-left: 8px;
}

.user-name-input>div {
  display: flex;
  width: 100%;
}

.change-name-btn {
  margin-left: 8px;
}

.cancel-change-name-btn {
  margin-left: auto;
}

.room-dropdown {
  position: relative;
  display: inline-block;
}

.room-dropdown:hover .dropdown-content {
  display: block;
}

.dropdown-content {
  display: none;
  left: -62px;
  position: absolute;
  background-color: v-bind('computedCss.colors.room.dropdown.main');
  min-width: 136px;
  z-index: 1;
  max-width: 344px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 8px;
}

.dropdown-content button {
  color: v-bind('computedCss.colors.room.dropdown.text');
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-weight: 600;
  border: none;
  background: none;
  transition: background-color 0.3s ease-in-out;
  border-radius: 8px;
}

.dropdown-content .selected {
  color: v-bind('computedCss.colors.room.dropdown.selected');
}

.dropdown-content button:hover {
  background-color: v-bind('computedCss.colors.room.dropdown.hover');
}

.dropdown-button {
  display: flex;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  color: v-bind('computedCss.colors.room.btn.text');
  stroke: v-bind('computedCss.colors.room.btn.text');
}

.dropdown-button svg {
  margin-left: 8px;
}

.dropdown-button:hover {
  color: v-bind('computedCss.colors.room.btn.textHover');
  stroke: v-bind('computedCss.colors.room.btn.textHover');
}

.chat-container {
  width: 360px;
  height: 600px;
  position: fixed;
  bottom: 16px;
  right: 16px;
  background-color: v-bind('computedCss.colors.background');
  border: 2px solid v-bind('computedCss.colors.border');
  border-radius: 8px;
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
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.settings-section {
  display: flex;
  align-items: center;
}

.settings-button:hover {
  color: v-bind('computedCss.colors.header.textHover');
}

.user-section {
  display: flex;
  font-size: 12px;
  width: 100%;
  justify-content: space-between;
}

.room-section {
  display: flex;
  align-items: center;
  width: 100%;
}

.chat-subHeader {
  display: flex;
  align-items: center;
  padding: 16px;
  width: 100%;
  background-color: v-bind('computedCss.colors.subHeader.main');
  color: v-bind('computedCss.colors.subHeader.text');
}

.non-edit {
  cursor: default;
}

.edit-user-input {
  font-size: 14px;
  border-radius: 8px;
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
  padding: 24px;
}

.message-input {
  display: flex;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  background-color: v-bind('computedCss.colors.input.main');
}

.message-input input {
  width: 100%;
  outline: none;
  font-size: 14px;
  color: v-bind('computedCss.colors.input.text');
  background-color: v-bind('computedCss.colors.input.main');
}

.message-input button {
  margin-left: auto;
}

.open-button,
.load-button,
.spinner {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  transition: background-color 0.3s ease-in-out;
  display: flex;
  justify-content: center;
  align-items: center;
}

.open-button,
.load-button,
.minimize-button,
.send-button {
  cursor: pointer;
}

.open-button,
.load-button,
.spinner {
  position: fixed;
  right: 34px;
  bottom: 36px;
}

.load-button {
  background-color: v-bind('computedCss.colors.loadBtn.main');
  color: v-bind('computedCss.colors.loadBtn.text');
  fill: v-bind('computedCss.colors.loadBtn.text');
}

.load-button:hover {
  background-color: v-bind('computedCss.colors.loadBtn.hover');
  color: v-bind('computedCss.colors.loadBtn.textHover');
  fill: v-bind('computedCss.colors.loadBtn.textHover');
}

.open-button {
  background-color: v-bind('computedCss.colors.openBtn.main');
  color: v-bind('computedCss.colors.openBtn.text');
  fill: v-bind('computedCss.colors.openBtn.text');
}

.open-button:hover {
  background-color: v-bind('computedCss.colors.openBtn.hover');
  color: v-bind('computedCss.colors.openBtn.textHover');
  fill: v-bind('computedCss.colors.openBtn.textHover');
}

.spinner {
  background-color: v-bind('computedCss.colors.loadingBtn.main');
  color: v-bind('computedCss.colors.loadingBtn.text');
  stroke: v-bind('computedCss.colors.loadingBtn.text');
}

.minimize-button {
  margin-left: 32px;
  stroke: v-bind('computedCss.colors.minimizeBtn.main');
}

.minimize-button:hover {
  stroke: v-bind('computedCss.colors.minimizeBtn.hover');
}

.send-button svg {
  fill: v-bind('computedCss.colors.sendBtn.main');
  color: v-bind('computedCss.colors.sendBtn.text');
}

.send-button:hover svg {
  fill: v-bind('computedCss.colors.sendBtn.hover');
  color: v-bind('computedCss.colors.sendBtn.textHover');
}

.send-button:disabled {
  cursor: auto;
}

.send-button:disabled svg {
  fill: v-bind('computedCss.colors.sendBtn.disabled');
  color: v-bind('computedCss.colors.sendBtn.text');
}

.spinner svg {
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
  margin: 4px 0px 8px 0px;
  align-self: end;
}

.own-message .user-name-baloon {
  align-self: end;
}

.user-name-baloon {
  font-size: 10px;
  margin-bottom: 4px;
  color: v-bind('computedCss.colors.chat.otherMessage.main');
}

.message-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.message-container div {
  align-self: start;
}

.message {
  min-width: 96px;
  max-width: 67%;
  padding: 16px;
  border-radius: 8px;
  background-color: v-bind('computedCss.colors.chat.otherMessage.main');
  color: v-bind('computedCss.colors.chat.otherMessage.text');
}

.timestamp {
  font-size: 9px;
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