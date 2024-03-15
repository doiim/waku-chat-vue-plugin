<script setup lang="ts">
import { ref, onMounted, watchEffect, onBeforeUnmount } from "vue";
import { Message } from "../types/ChatTypes";
import {
  initialization,
  sendMessage,
  loadChat,
  setRoom,
  getParticipants,
  getStatus,
  getMessageList,
  getRoom,
  setMyName,
  getMyName,
  getMyID,
  getOptions,
  onDestroyWaku
} from "../components/WakuLogic"

const isChatOpen = ref<boolean>(false);

const messageFiltered = ref<Message[]>([]);
const messageInput = ref<string>('');

const computedCss = ref<any>({
  primaryColor: 'rgba(29, 78, 216, 1)',
  primaryColorHover: 'rgba(29, 78, 180, 1)',
  primaryTextColor: 'rgba(255, 255, 255, 1)',
  secondaryColor: 'rgba(229, 231, 235, 1)',
  secondaryColorHover: 'rgba(229, 231, 235, 0.7)',
  secondaryTextColor: 'rgba(0, 0, 0, 1)',
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  myMessageColor: 'rgba(29, 78, 216, 1)',
  myMessageTextColor: 'rgba(255, 255, 255, 1)',
  otherMessageColor: 'rgba(136, 153, 166, 0.3)',
  otherMessageTextColor: 'rgba(29, 78, 216, 1)',
});

const editMode = ref(false);
const editedUserName = ref('');

const messageContainerRef = ref<HTMLElement | null>(null);

onMounted(() => {
  initialization();

  editedUserName.value = getMyName();

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

const openChat = () => {
  if (getStatus() !== "connected") {
    loadChat()
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
  messageFiltered.value = getMessageList().filter(message => {
    return message.room === getRoom();
  })
  if (messageFiltered.value.length > 0)
    scrollToBottom();
});

watchEffect(() => {
  const props = getOptions();
  const cssConfig = props?.cssConfig as Record<string, string> | undefined;;

  if (!cssConfig) return;

  const cssProperties = [
    'primaryColor',
    'primaryColorHover',
    'primaryTextColor',
    'secondaryColor',
    'secondaryColorHover',
    'secondaryTextColor',
    'backgroundColor',
    'otherMessageColor',
    'otherMessageTextColor',
    'myMessageColor',
    'myMessageTextColor',
  ];

  cssProperties.forEach((property) => {
    if (cssConfig[property]) {
      computedCss.value[property] = cssConfig[property];
    }
  });
});

</script>

<template>
  <div v-if="getStatus() === 'connected'">
    <div v-if="isChatOpen" class="chat-container" :class="{ 'open': isChatOpen }">
      <div class="chat-header">
        <div class="user-section">
          <div v-if="getOptions()?.changeNickMode === 'interface'" class="user-profile" @click="enterEditMode">
            <span v-if="!editMode">{{ getMyName() }}</span>
            <input v-model="editedUserName" v-else @blur="exitEditMode" @keypress.enter="saveEditedUserName"
              class="edit-user-input" />
          </div>
          <div v-else class="user-profile non-edit">
            <span>{{ getMyName() }}</span>
          </div>
          <button @click="closeChat" class="minimize-button">-</button>
        </div>
        <div class="room-section">
          <div class="room-info">
            <span class="room-name">{{ getRoomName(getRoom()) + ' room' }}</span>
          </div>
          <div class="room-dropdown">
            <button class="dropdown-button">Change Room</button>
            <div class="dropdown-content">
              <div v-for="availableRoom in getOptions()?.availableRooms" :key="availableRoom">
                <button @click="changeRoomDropdown(availableRoom)">
                  {{ availableRoom }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="chat-body" ref="messageContainerRef">
        <div v-for="message in messageFiltered" :key="message.id"
          :class="{ 'own-message': message.author.id === getMyID() }" class="message-container">
          <div class="message">
            <div class="message-info">
              <span>
                <span class="user-name-baloon">
                  {{ message.author.name }}
                </span>
              </span>
            </div>
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
  background-color: v-bind('computedCss.primaryColor');
  min-width: 100%;
  z-index: 1;
  max-width: 256px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 16px;
  border: 2px solid v-bind('computedCss.secondaryColor');
}

.dropdown-content button {
  color: v-bind('computedCss.primaryTextColor');
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
  background-color: v-bind('computedCss.primaryColorHover');
}

.dropdown-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: v-bind('computedCss.primaryTextColor');
}

.chat-container {
  width: 368px;
  height: 592px;
  position: fixed;
  bottom: 16px;
  right: 16px;
  background-color: v-bind('computedCss.secondaryColor');
  border: 2px solid v-bind('computedCss.primaryColor');
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease-in-out;
}

.chat-container.open {
  transform: translateY(0);
}

.chat-header {
  background-color: v-bind('computedCss.primaryColor');
  color: v-bind('computedCss.primaryTextColor');
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  flex-direction: column;
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
  justify-content: space-between;
}

.user-profile {
  display: flex;
  align-items: center;
  height: 48px;
  border: 2px solid v-bind('computedCss.secondaryColor');
  padding: 0px 8px;
  width: 100%;
  margin-right: 8px;
  cursor: pointer;
  background-color: v-bind('computedCss.primaryColor');
  transition: background-color 0.3s ease-in-out;
  border-radius: 16px;
}

.user-profile:hover {
  background-color: v-bind('computedCss.primaryColorHover');
}

.non-edit {
  cursor: default;
}

.edit-user-input {
  font-size: 14px;
  border: 1px solid v-bind('computedCss.primaryColor');
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
  background-color: v-bind('computedCss.backgroundColor');
}

.message-info {
  display: flex;
  align-items: center;
}

.chat-footer {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: v-bind('computedCss.backgroundColor');
}

.message-input {
  font-size: 18px;
  flex: 1;
  height: 32px;
  padding: 16px;
  border: 2px solid v-bind('computedCss.primaryColor');
  color: v-bind('computedCss.primaryColor');
  background-color: v-bind('computedCss.backgroundColor');
  border-radius: 16px;
}

.open-button,
.spinner,
.minimize-button,
.send-button {
  width: 64px;
  height: 64px;
  background-color: v-bind('computedCss.primaryColor');
  color: v-bind('computedCss.primaryTextColor');
  border-radius: 50%;
  border: 2px solid v-bind('computedCss.secondaryColor');
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

.open-button:hover,
.minimize-button:hover,
.send-button:hover {
  background-color: v-bind('computedCss.primaryColorHover');
}

.open-button,
.spinner {
  position: fixed;
  right: 34px;
  bottom: 36px;
}


.spinner div {
  width: 16px;
  height: 16px;
  border: 4px solid v-bind('computedCss.secondaryColor');
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.minimize-button {
  width: 32px;
  height: 32px;
}

.own-message .user-name-baloon {
  color: v-bind('computedCss.myMessageTextColor');
}

.own-message div {
  align-self: start;
}

.own-message .message {
  background-color: v-bind('computedCss.myMessageColor');
  color: v-bind('computedCss.myMessageTextColor');
}

.user-name-baloon {
  font-weight: bold;
  width: 100%;
  margin-left: 4px;
  text-align: start;
  color: v-bind('computedCss.primaryColor');
}

.user-name-baloon-btn {
  background: none;
  border: none;
  color: v-bind('computedCss.secondaryColor');
  cursor: pointer;
  font-weight: bold;
  text-decoration: underline;
}

.message-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.message-container div {
  align-self: end;
}

.message {
  min-width: 96px;
  max-width: 67%;
  padding: 10px;
  border-radius: 16px;
  background-color: v-bind('computedCss.otherMessageColor');
  color: v-bind('computedCss.otherMessageTextColor');
}

.timestamp {
  font-size: 12px;
  color: v-bind('computedCss.primaryColor');
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