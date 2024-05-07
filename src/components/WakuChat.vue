<script setup lang="ts">
import { ref, watchEffect, defineProps, computed, watch, onBeforeUnmount } from "vue";
import {
  sendMessage,
  loadChat,
  setRoom,
  getStatus,
  getRoom,
  setMyName,
  getMyName,
  setMyID,
  getOptions,
  onDestroyWaku,
  disconnectChat
} from "../components/WakuLogic"
import { defaultCss, mergeCssConfiguration } from "../utils/defaultStyle";
import ChatContainer from "./ChatContainer.vue";

const props = defineProps<{
  externalUserId?: string;
  externalUserName?: string;
}>()

const isChatOpen = ref<boolean>(false);
const settingsMenu = ref<boolean>(false);
const loadingRoom = ref<boolean>(false);
const showSettings = ref<boolean>(false);
const showSystemMessages = ref<boolean>(false);
const userShowSystemMessages = ref<boolean>(false);
const editMode = ref(false);
const editedUserName = ref('');
const roomDropdownOpened = ref<boolean>(false);
var cssConfiguration = ref<any>(defaultCss);
const idleTimeout = ref<NodeJS.Timeout>()

const propUserId = computed(() => {
  return props.externalUserId
});

const propUserName = computed(() => {
  return props.externalUserName
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
  const options = getOptions();
  const colorConfig = options?.cssConfig as Record<string, any> | undefined;;

  if (!colorConfig) return;

  cssConfiguration.value = mergeCssConfiguration(cssConfiguration.value, colorConfig);
});

onBeforeUnmount(() => {
  onDestroyWaku();
});

const handleToggleRoomDropdown = () => {
  roomDropdownOpened.value = !roomDropdownOpened.value
};

const changeRoomDropdown = async (selectedRoom: string) => {
  handleToggleRoomDropdown()
  if (selectedRoom === getRoom()) return
  loadingRoom.value = true
  await setRoom(selectedRoom);
  loadingRoom.value = false
};

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
          <ChatContainer :cssConfiguration="cssConfiguration" :open="isChatOpen"/>
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

<style scoped lang="css">
.user-name-input {
  width: 100%;
}

.user-name-input input {
  line-height: 16px;
  width: 50%;
  outline: none;
  padding-left: 8px;
  color: v-bind('cssConfiguration.colors.subHeader.editName.text');
  background-color: v-bind('cssConfiguration.colors.subHeader.editName.main');
}

.user-name-input div span {
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px !important;
}

.user-name-input svg {
  cursor: pointer;
  stroke: v-bind('cssConfiguration.colors.subHeader.editName.text');
  margin-left: 8px;
}

.user-name-input>div {
  display: flex;
  width: 100%;
}

.change-name-btn {
  cursor: pointer;
  margin-left: 8px;
  color: v-bind('cssConfiguration.colors.subHeader.text');
  background: transparent;
  border: none;
}

.change-name-btn:hover {
  color: v-bind('cssConfiguration.colors.subHeader.textHover');
}

.cancel-change-name-btn {
  cursor: pointer;
  margin-left: auto;
  color: v-bind('cssConfiguration.colors.subHeader.text');
  background: transparent;
  border: none;
}

.cancel-change-name-btn:hover {
  color: v-bind('cssConfiguration.colors.subHeader.textHover');
}

.room-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  display: block;
  left: -62px;
  position: absolute;
  background-color: v-bind('cssConfiguration.colors.room.dropdown.main');
  min-width: 136px;
  z-index: 1;
  max-width: 344px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 8px;
}

.dropdown-content button {
  color: v-bind('cssConfiguration.colors.room.dropdown.text');
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
  color: v-bind('cssConfiguration.colors.room.dropdown.selected');
}

.dropdown-content button:hover {
  background-color: v-bind('cssConfiguration.colors.room.dropdown.hover');
}

.dropdown-button {
  display: flex;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  line-height: 14px;
  align-items: center;
  color: v-bind('cssConfiguration.colors.room.btn.text');
  stroke: v-bind('cssConfiguration.colors.room.btn.text');
}

.dropdown-button svg {
  margin-left: 8px;
}

.dropdown-button:hover {
  color: v-bind('cssConfiguration.colors.room.btn.textHover');
  stroke: v-bind('cssConfiguration.colors.room.btn.textHover');
  text-decoration: underline;
}

.chat-container {
  width: 360px;
  height: 600px;
  position: fixed;
  bottom: 16px;
  right: 16px;
  background-color: v-bind('cssConfiguration.colors.background');
  border: v-bind('cssConfiguration.border.size') solid v-bind('cssConfiguration.colors.border');
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease-in-out;
  box-shadow: 0px 10px 25px -5px rgba(0, 0, 0, v-bind('cssConfiguration.shadows.openedComponent'));
}

.chat-container.open {
  transform: translateY(0);
}

.change-room-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.2);
  stroke: v-bind('cssConfiguration.colors.border');
  text-align: center;
  align-content: center;
  z-index: 1000;
}

.change-room-overlay svg {
  animation: spin 1s linear infinite;
}

.chat-header {
  background-color: v-bind('cssConfiguration.colors.header.main');
  color: v-bind('cssConfiguration.colors.header.text');
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

.settings-button {
  color: v-bind('cssConfiguration.colors.header.btn');
  background: transparent;
  line-height: 14px;
  border: none;
}

.settings-button:hover {
  color: v-bind('cssConfiguration.colors.header.btnHover');
  text-decoration: underline;
  cursor: pointer;
}

.user-section {
  display: flex;
  font-size: 12px !important;
  width: 100%;
  justify-content: space-between;
}

.system-message-section {
  display: flex;
  font-size: 12px !important;
  width: 100%;
}

.system-message-section input {
  margin: 0px;
  cursor: pointer;
}

.system-message-section label {
  margin-left: 8px;
  cursor: pointer;
}

.room-section {
  display: flex;
  width: 100%;
}

.chat-subHeader {
  display: flex;
  flex-direction: column;
  align-items: normal;
  padding: 16px;
  min-height: 48px;
  font-size: 12px !important;
  gap: 8px;
  background-color: v-bind('cssConfiguration.colors.subHeader.main');
  color: v-bind('cssConfiguration.colors.subHeader.text');
}

.edit-user-input {
  border: none;
  border-radius: 8px;
  margin: 4px 0px;
  height: 38px;
  width: 100%;
}

.room-info {
  margin-right: 10px;
  line-height: 16px;
  font-size: 12px !important;
  color: v-bind('cssConfiguration.colors.header.text');
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
  position: fixed;
  right: 34px;
  bottom: 36px;
}

.open-button,
.load-button,
.minimize-button {
  cursor: pointer;
  border-width: 0px;
}

.load-button {
  background-color: v-bind('cssConfiguration.colors.loadBtn.main');
  color: v-bind('cssConfiguration.colors.loadBtn.text');
  fill: v-bind('cssConfiguration.colors.loadBtn.text');
}

.load-button:hover {
  background-color: v-bind('cssConfiguration.colors.loadBtn.hover');
  color: v-bind('cssConfiguration.colors.loadBtn.textHover');
  fill: v-bind('cssConfiguration.colors.loadBtn.textHover');
}

.open-button {
  background-color: v-bind('cssConfiguration.colors.openBtn.main');
  color: v-bind('cssConfiguration.colors.openBtn.text');
  fill: v-bind('cssConfiguration.colors.openBtn.text');
}

.open-button:hover {
  background-color: v-bind('cssConfiguration.colors.openBtn.hover');
  color: v-bind('cssConfiguration.colors.openBtn.textHover');
  fill: v-bind('cssConfiguration.colors.openBtn.textHover');
}

.spinner {
  background-color: v-bind('cssConfiguration.colors.loadingBtn.main');
  color: v-bind('cssConfiguration.colors.loadingBtn.text');
  stroke: v-bind('cssConfiguration.colors.loadingBtn.text');
}

.minimize-button {
  margin-left: 32px;
  stroke: v-bind('cssConfiguration.colors.minimizeBtn.main');
  background: transparent;
}

.minimize-button svg {
  vertical-align: middle;
}

.minimize-button:hover {
  stroke: v-bind('cssConfiguration.colors.minimizeBtn.hover');
}

.spinner svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.waku-chat-vue-plugin div,
.waku-chat-vue-plugin button,
.waku-chat-vue-plugin span,
.waku-chat-vue-plugin input {
  font-family: IBM Plex Sans;
  font-size: 14px;
}

.slide-enter-active {
  animation: translate-out .5s reverse;
}

.slide-leave-active {
  animation: translate-out .5s;
}

@keyframes translate-out {
  0% {
    transform: translateY(0%);
  }

  100% {
    transform: translateY(110%);
  }
}

.fade-enter-active {
  animation: fade-in .5s;
}

.fade-leave-active {
  animation: fade-in .5s reverse;
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

.fastFade-enter-active {
  animation: fastFade-in .5s;
}

.fastFade-leave-active {
  animation: fastFade-in .5s reverse;
}

@keyframes fastFade-in {
  0% {
    opacity: 0;
  }

  60% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}
</style>