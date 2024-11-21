<script setup lang="ts">
import {
  ref,
  watchEffect,
  defineProps,
  computed,
  watch,
  onBeforeUnmount,
} from "vue";
import TinyColor from "tinycolor2";
import {
  sendMessage,
  loadChat,
  setRoom,
  getStatus,
  getRoom,
  setMyName,
  getMyName,
  setMyType,
  getMyType,
  setMyID,
  getOptions,
  onDestroyWaku,
  disconnectChat,
  setFetchMsgsOnScroll,
  setFetchMaxAttempts,
  setFetchLimit,
  setFetchTotalLimit,
  setDebugMode,
  setMessageAgeToDownload,
} from "../components/WakuLogic";
import { defaultCss, applyDefaultStyle } from "../utils/defaultStyle";
import ChatContainer from "./ChatContainer.vue";
import { WakuChatConfigCss } from "../types/ChatTypes";

const props = defineProps<{
  externalUserId?: string;
  externalUserName?: string;
  externalUserType?: string;
  onOpen?: () => void;
  onClose?: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  theme?: string;
  balloonPos?: {
    top?: string;
    left?: string;
    bottom?: string;
    right?: string;
  };
  chatPos?: {
    top?: string;
    left?: string;
    bottom?: string;
    right?: string;
  };
  animationDirection?: string;
  chatSize?: {
    width?: string;
    height?: string;
  };
  fetchMsgsOnScroll?: boolean;
  fetchMaxAttempts?: number;
  fetchLimit?: number;
  fetchTotalLimit?: number;
  messageAgeToDownload?: number;
  debugMode?: boolean;
}>();

const isChatOpen = ref<boolean>(false);
const settingsMenu = ref<boolean>(false);
const loadingRoom = ref<boolean>(false);
const showSettings = ref<boolean>(false);
const showSystemMessages = ref<boolean>(false);
const userShowSystemMessages = ref<boolean>(false);
const editMode = ref(false);
const editedUserName = ref("");
const roomDropdownOpened = ref<boolean>(false);
var styleConfig = ref<WakuChatConfigCss>();
const idleTimeout = ref<NodeJS.Timeout>();
const isLoading = ref(false);

const propFetchOnScroll = computed(() => props.fetchMsgsOnScroll);
const propFetchLimit = computed(() => props.fetchLimit);
const propDebugMode = computed(() => props.debugMode);
const propMaxAttempts = computed(() => props.fetchMaxAttempts);
const propFetchTotalLimit = computed(() => props.fetchTotalLimit || 0);
const propMessageAgeToDownload = computed(() => props.messageAgeToDownload);

watch([propMaxAttempts], () => {
  if (propMaxAttempts.value) {
    setFetchMaxAttempts(propMaxAttempts.value);
  }
});

watch([propFetchLimit], () => {
  if (propFetchLimit.value) {
    setFetchLimit(propFetchLimit.value);
  }
});

watch([propFetchTotalLimit], () => {
  if (propFetchTotalLimit.value !== undefined) {
    setFetchTotalLimit(propFetchTotalLimit.value);
  }
});

watch([propDebugMode], () => {
  if (propDebugMode.value !== undefined) {
    setDebugMode(propDebugMode.value);
  }
});

watch([propFetchOnScroll], () => {
  if (propFetchOnScroll.value !== undefined) {
    setFetchMsgsOnScroll(propFetchOnScroll.value);
  }
});

watch([propMessageAgeToDownload], () => {
  if (propMessageAgeToDownload.value !== undefined) {
    setMessageAgeToDownload(propMessageAgeToDownload.value);
  }
});

const balloonPosition = computed(() => {
  var pos = props.balloonPos;
  if (!pos) {
    pos = {};
  }
  if (!pos?.top && !pos?.bottom) {
    pos.bottom = "36px";
  }
  if (!pos?.left && !pos?.right) {
    pos.right = "34px";
  }
  return pos;
});

const chatPosition = computed(() => {
  var pos = props.chatPos;
  if (!pos) {
    pos = {};
  }
  if (!pos?.top && !pos?.bottom) {
    pos.bottom = "16px";
  }
  if (!pos?.left && !pos?.right) {
    pos.right = "16px";
  }
  return pos;
});

const chatSize = computed(() => {
  var pos = props.chatSize;
  if (!pos) pos = {};
  if (!pos.width) {
    pos.width = "360px";
  }
  if (!pos.height) {
    pos.height = "576px";
  }
  return pos;
});

const hideClose = computed(() => {
  return getOptions()?.hideClose;
});

const propUserId = computed(() => {
  return props.externalUserId;
});

const propUserName = computed(() => {
  return props.externalUserName;
});

const propUserType = computed(() => {
  return props.externalUserType;
});

const isDark = computed(() => {
  return props.theme === "dark";
});

watch([propUserId], () => {
  if (propUserId.value) {
    setMyID(propUserId.value);
  }
});

watch([propUserName], () => {
  setMyName(propUserName.value);
});

watch([propUserType], () => {
  setMyType(propUserType.value);
});

const lightColors = ref({
  primary: "none",
  secondary: "none",
  tertiary: "none",
  quaternary: "none",
  grayScale: [
    "rgba(249, 250, 251, 1)",
    "rgba(229, 231, 235, 1)",
    "rgba(156, 163, 175, 1)",
    "rgba(107, 114, 128, 1)",
    "rgba(75, 85, 99, 1)",
    "rgba(31, 41, 55, 1)",
  ],
});

const darkColors = ref({
  primary: "none",
  secondary: "none",
  tertiary: "none",
  quaternary: "none",
  grayScale: [
    "rgba(17, 24, 39, 1)",
    "rgba(31, 41, 55, 1)",
    "rgba(55, 65, 81, 1)",
    "rgba(55, 65, 81, 1)",
    "rgba(209, 213, 219, 1)",
    "rgba(229, 231, 235, 1)",
  ],
});

const processColors = () => {
  if (!styleConfig.value) return;
  const primaryLightColor = new TinyColor(
    styleConfig.value.colors.light.primary
  );

  //light
  lightColors.value = {
    ...lightColors.value,
    ...styleConfig.value.colors.light,
  };
  lightColors.value.primary = primaryLightColor.toRgbString();
  if (!styleConfig.value.colors.light.secondary) {
    lightColors.value.secondary = primaryLightColor
      .clone()
      .saturate(23)
      .darken(14)
      .toRgbString();
  }
  if (!styleConfig.value.colors.light.tertiary) {
    lightColors.value.tertiary = primaryLightColor
      .clone()
      .saturate(3)
      .lighten(35)
      .toRgbString();
  }
  if (!styleConfig.value.colors.light.quaternary) {
    lightColors.value.quaternary = primaryLightColor
      .clone()
      .saturate(34)
      .lighten(45)
      .toRgbString();
  }

  //dark
  if (styleConfig.value.colors.dark) {
    darkColors.value = {
      ...darkColors.value,
      ...styleConfig.value.colors.dark,
    };
  }

  if (!styleConfig.value.colors.dark?.primary) {
    darkColors.value.primary = primaryLightColor
      .clone()
      .saturate(13)
      .lighten(2)
      .toRgbString();
  }
  const primaryDarkColor = new TinyColor(darkColors.value.primary);

  if (!styleConfig.value.colors.dark?.secondary) {
    darkColors.value.secondary = primaryDarkColor
      .clone()
      .saturate(20)
      .lighten(42)
      .toRgbString();
  }
  if (!styleConfig.value.colors.dark?.tertiary) {
    darkColors.value.tertiary = primaryDarkColor
      .clone()
      .desaturate(10)
      .lighten(30)
      .toRgbString();
  }
  if (!styleConfig.value.colors.dark?.quaternary) {
    darkColors.value.quaternary = primaryDarkColor
      .clone()
      .darken(15)
      .toRgbString();
  }
};

watchEffect(() => {
  const options = getOptions();
  styleConfig.value = options?.styleConfig;

  styleConfig.value = applyDefaultStyle(defaultCss, styleConfig.value);
  processColors();
});

onBeforeUnmount(() => {
  onDestroyWaku();
});

const handleToggleRoomDropdown = () => {
  roomDropdownOpened.value = !roomDropdownOpened.value;
};

const changeRoomDropdown = async (selectedRoom: string) => {
  handleToggleRoomDropdown();
  if (selectedRoom === getRoom()) return;
  loadingRoom.value = true;
  await setRoom(selectedRoom);
  loadingRoom.value = false;
};

const enterEditMode = () => {
  editMode.value = true;
  editedUserName.value = getMyName();
};

const exitEditMode = () => {
  editMode.value = false;
};

const saveEditedUserName = () => {
  const myName = getMyName();
  setMyName(editedUserName.value);
  sendMessage("changeName:" + myName, "system");
  exitEditMode();
};

const openChat = async () => {  
  // Set loading and open states immediately
  isLoading.value = true;
  isChatOpen.value = true;

  clearTimeout(idleTimeout.value);
  
  connectChat();
};

const connectChat = async () => {
   // If not connected, start connection process
   if (getStatus() !== "connected") {
    showSettings.value = !!getOptions()?.showSettings;
    showSystemMessages.value = !!getOptions()?.showSystemMessages;
    
    if (propUserId.value) {
      setMyID(propUserId.value);
    }
    if (propUserName.value) {
      setMyName(propUserName.value);
    }
    if (propUserType.value) {
      setMyType(propUserType.value);
    }
    
    try {
      await loadChat();
      if (props.onConnect) {
        props.onConnect();
      }
    } finally {
      isLoading.value = false;
    }
  } else {
    isLoading.value = false;
  }
  
  if (props.onOpen) {
    props.onOpen();
  }
};

const closeChat = () => {
  isChatOpen.value = false;
  const disconnectDelay = getOptions()?.disconnectDelay;
  idleTimeout.value = setTimeout(
    disconnectChat.bind(undefined, props.onDisconnect),
    disconnectDelay ? disconnectDelay : 5 * 60 * 1000
  );
  if (props.onClose) {
    props.onClose();
  }
};

const animDirection = () => {
  const animDirection = props.animationDirection;

  if (animDirection === "down") {
    return "slideDown";
  } else if (animDirection === "up") {
    return "slideUp";
  } else if (animDirection === "right") {
    return "slideRight";
  } else if (animDirection === "left") {
    return "slideLeft";
  }
  return "slideUp";
};

defineExpose({openChat, closeChat, connectChat});
</script>

<template>
  <div class="waku-chat-vue-plugin">
    <Transition :name="animDirection()" mode="out-in">
        <div v-if="isChatOpen && (getStatus() === 'connected' || getStatus() === 'connecting')" class="chat-container" :class="{ dark: isDark }">
          <Transition name="fade" mode="out-in">
            <div
              v-if="loadingRoom"
              class="change-room-overlay"
              :class="{ dark: isDark }"
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke-opacity="0.4"
                  stroke-width="4"
                />
                <path
                  d="M12 22C10.6868 22 9.38642 21.7413 8.17317 21.2388C6.95991 20.7362 5.85752 19.9997 4.92893 19.0711C4.00035 18.1425 3.26375 17.0401 2.7612 15.8268C2.25866 14.6136 2 13.3132 2 12"
                  stroke-opacity="0.8"
                  stroke-width="4"
                />
                <path
                  d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.76121C17.0401 3.26375 18.1425 4.00035 19.0711 4.92894C19.9997 5.85752 20.7363 6.95992 21.2388 8.17317C21.7413 9.38643 22 10.6868 22 12"
                  stroke-opacity="0.8"
                  stroke-width="4"
                />
              </svg>
            </div>
          </Transition>
          <div class="chat-header" :class="{ dark: isDark }">
            <div class="visible-section">
              <div class="room-section">
                <div class="room-info" :class="{ dark: isDark }">Room</div>
                <div class="room-dropdown">
                  <button
                    class="dropdown-button"
                    :class="{ dark: isDark }"
                    @click="handleToggleRoomDropdown"
                  >
                    <div class="room-text">{{ getRoom() }}</div>
                    <svg
                      width="16"
                      height="17"
                      viewBox="0 0 16 17"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 6.5L8 10.5L12 6.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <div
                  v-if="roomDropdownOpened"
                  class="dropdown-content"
                  :class="{ dark: isDark }"
                >
                  <div
                    v-for="availableRoom in getOptions()?.availableRooms"
                    :key="availableRoom"
                  >
                    <button
                      :class="availableRoom === getRoom() ? 'selected' : ''"
                      @click="changeRoomDropdown(availableRoom)"
                    >
                      {{ availableRoom }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="showSettings" class="settings-section">
                <button
                  @click="settingsMenu = !settingsMenu"
                  class="settings-button"
                  :class="{ dark: isDark }"
                >
                  Settings
                </button>
              </div>
              <button
                v-if="!hideClose"
                @click="closeChat"
                class="minimize-button"
                :class="{ dark: isDark }"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.5 0.5L0.5 11.5M0.5 0.5L11.5 11.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
            <Transition name="fade">
              <div
                v-if="settingsMenu"
                class="chat-subHeader"
                :class="{ dark: isDark }"
              >
                <div class="user-section">
                  <div
                    v-if="getOptions()?.userChangeNick"
                    class="user-name-input-holder"
                    :class="{ dark: isDark }"
                  >
                    <div v-if="!editMode">
                      <div class="user-name-input">
                        <b v-if="getMyType()">{{ getMyType() }} :</b>
                        <span>{{ getMyName() }}</span>
                      </div>
                      <svg
                        width="14"
                        height="13"
                        viewBox="0 0 14 13"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        @click="enterEditMode"
                      >
                        <path
                          d="M7 12.3333H13M10 1.33334C10.2652 1.06813 10.6249 0.919128 11 0.919128C11.1857 0.919128 11.3696 0.955708 11.5412 1.02678C11.7128 1.09785 11.8687 1.20202 12 1.33334C12.1313 1.46466 12.2355 1.62057 12.3066 1.79215C12.3776 1.96373 12.4142 2.14762 12.4142 2.33334C12.4142 2.51906 12.3776 2.70296 12.3066 2.87454C12.2355 3.04612 12.1313 3.20202 12 3.33334L3.66667 11.6667L1 12.3333L1.66667 9.66668L10 1.33334Z"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </div>
                    <div v-else>
                      <input
                        v-model="editedUserName"
                        @keypress.enter="saveEditedUserName"
                        class="edit-user-input"
                      />
                      <button
                        class="change-name-btn"
                        :class="{ dark: isDark }"
                        @click="saveEditedUserName"
                      >
                        OK
                      </button>
                      <button
                        class="cancel-change-name-btn"
                        :class="{ dark: isDark }"
                        @click="exitEditMode"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  <div class="user-name-input" v-else>
                    <b v-if="getMyType()">{{ getMyType() }} :</b>
                    <span>{{ getMyName() }}</span>
                  </div>
                </div>
                <div v-if="showSystemMessages" class="system-message-section">
                  <input
                    id="showSystemMEssages"
                    type="checkbox"
                    v-model="userShowSystemMessages"
                  />
                  <label for="showSystemMEssages">Show system messages</label>
                </div>
              </div>
            </Transition>
          </div>
          <ChatContainer
            :styleConfig="styleConfig"
            :lightColors="lightColors"
            :darkColors="darkColors"
            :open="isChatOpen"
            :theme="theme"
            :height="`calc(${chatSize.height} - 19px)`"
            :fetchMsgsOnScroll="props.fetchMsgsOnScroll"
            :isLoading="isLoading"
            :fetchOnScroll="propFetchOnScroll"
          />
        </div>
      </Transition>
      <Transition name="fastFade" mode="out-in">
        <button
          v-if="!isChatOpen"
          @click="openChat"
          class="open-button"
          :class="{ dark: isDark }"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </Transition>
      <Transition name="fastFade" mode="out-in">
        <div v-if="getStatus() === 'disconnected'">
          <button @click="openChat" class="load-button" :class="{ dark: isDark }">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </Transition>
  </div>
</template>

<style scoped lang="css">
.user-name-input-holder {
  width: 100%;
}

.user-name-input-holder input {
  line-height: 16px;
  width: 70%;
  outline: none;
  padding-left: 8px;
  color: v-bind("lightColors.grayScale[5]");
  background-color: v-bind("lightColors.grayScale[1]");
}

.user-name-input-holder.dark input {
  color: v-bind("darkColors.grayScale[5]");
  background-color: v-bind("darkColors.grayScale[1]");
}

.user-name-input {
  max-width: 70%;
  display: flex;
  align-items: self-end;
}

.user-name-input span {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px !important;
}

.user-name-input-holder svg {
  cursor: pointer;
  stroke: v-bind("lightColors.grayScale[5]");
  margin-left: 8px;
}

.user-name-input-holder.dark svg {
  cursor: pointer;
  stroke: v-bind("darkColors.grayScale[5]");
  margin-left: 8px;
}

.user-name-input-holder > div {
  display: flex;
  width: 100%;
}

.change-name-btn {
  cursor: pointer;
  margin-left: 8px;
  color: v-bind("lightColors.primary");
  background: transparent;
  border: none;
}

.change-name-btn.dark {
  color: v-bind("darkColors.secondary");
}

.change-name-btn:hover {
  color: v-bind("lightColors.secondary");
}

.change-name-btn.dark:hover {
  color: v-bind("darkColors.tertiary");
}

.cancel-change-name-btn {
  cursor: pointer;
  margin-left: auto;
  color: v-bind("lightColors.primary");
  background: transparent;
  border: none;
}

.cancel-change-name-btn.dark {
  color: v-bind("darkColors.secondary");
}

.cancel-change-name-btn:hover {
  color: v-bind("lightColors.secondary");
}

.cancel-change-name-btn.dark:hover {
  color: v-bind("darkColors.tertiary");
}

.room-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  display: block;
  left: 16px;
  top: 36px;
  position: absolute;
  background-color: v-bind("lightColors.grayScale[0]");
  min-width: 136px;
  z-index: 20;
  max-width: 344px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 8px;
  border: v-bind("styleConfig?.border.size") solid v-bind("lightColors.primary");
}

.dropdown-content.dark {
  background-color: v-bind("darkColors.grayScale[0]");
  border: v-bind("styleConfig?.border.size") solid v-bind("darkColors.primary");
}

.dropdown-content button {
  color: v-bind("lightColors.grayScale[5]");
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

.dropdown-content.dark button {
  color: v-bind("darkColors.grayScale[5]");
}

.dropdown-content .selected {
  color: v-bind("lightColors.primary");
}

.dropdown-content.dark .selected {
  color: v-bind("darkColors.primary");
}

.dropdown-content button:hover {
  background-color: v-bind("lightColors.tertiary");
}

.dropdown-content.dark button:hover {
  background-color: v-bind("darkColors.tertiary");
}

.dropdown-button {
  display: flex;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  line-height: 14px;
  align-items: center;
  color: v-bind("lightColors.primary");
  stroke: v-bind("lightColors.primary");
}

.dropdown-button.dark {
  color: v-bind("darkColors.secondary");
  stroke: v-bind("darkColors.secondary");
}

.room-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.dropdown-button svg {
  margin-left: 8px;
}

.dropdown-button:hover {
  color: v-bind("lightColors.secondary");
  stroke: v-bind("lightColors.secondary");
  text-decoration: underline;
}

.dropdown-button.dark:hover {
  color: v-bind("darkColors.tertiary");
  stroke: v-bind("darkColors.tertiary");
}

.chat-container {
  width: v-bind("chatSize.width");
  position: fixed;
  top: v-bind("chatPosition?.top");
  left: v-bind("chatPosition?.left");
  bottom: v-bind("chatPosition?.bottom");
  right: v-bind("chatPosition?.right");
  background-color: v-bind("lightColors.grayScale[1]");
  border: v-bind("styleConfig?.border.size") solid v-bind("lightColors.primary");
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease-in-out;
  box-shadow: 0px 10px 25px -5px rgba(0, 0, 0, v-bind("styleConfig?.shadows.openedComponent"));
}

.chat-container.dark {
  background-color: v-bind("darkColors.grayScale[1]");
  border: v-bind("styleConfig?.border.size") solid v-bind("darkColors.primary");
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
  stroke: v-bind("lightColors.secondary");
  text-align: center;
  align-content: center;
  z-index: 100;
}

.change-room-overlay.dark {
  stroke: v-bind("darkColors.secondary");
}

.change-room-overlay svg {
  animation: spin 1s linear infinite;
}

.chat-header {
  height: 19px;
  background-color: v-bind("lightColors.quaternary");
  color: v-bind("lightColors.grayScale[3]");
  padding: 12px 16px;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.chat-header.dark {
  background-color: v-bind("darkColors.quaternary");
  color: v-bind("darkColors.grayScale[3]");
}

.chat-header > div {
  display: flex;
}

.settings-section {
  display: flex;
  align-items: center;
}

.settings-button {
  color: v-bind("lightColors.primary");
  background: transparent;
  line-height: 14px;
  border: none;
}

.settings-button.dark {
  color: v-bind("darkColors.secondary");
}

.settings-button:hover {
  color: v-bind("lightColors.secondary");
  text-decoration: underline;
  cursor: pointer;
}

.settings-button.dark:hover {
  color: v-bind("darkColors.tertiary");
}

.user-section {
  display: flex;
  font-size: 12px !important;
  justify-content: space-between;
}

.system-message-section {
  display: flex;
  font-size: 12px !important;
}

.system-message-section input {
  margin: 0px;
  cursor: pointer;
}

.system-message-section label {
  margin-left: 8px;
  cursor: pointer;
}

.visible-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.room-section {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.chat-subHeader {
  display: flex;
  z-index: 10;
  position: absolute;
  flex-direction: column;
  align-items: normal;
  padding: 16px 0px;
  min-height: 48px;
  font-size: 12px !important;
  gap: 8px;
  width: 100%;
  margin-left: -16px;
  margin-top: 12px;
  background-color: v-bind("lightColors.quaternary");
  color: v-bind("lightColors.primary");
}

.chat-subHeader.dark {
  background-color: v-bind("darkColors.quaternary");
  color: v-bind("darkColors.secondary");
}

.chat-subHeader > div {
  padding: 0px 16px;
  width: auto;
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
  color: v-bind("lightColors.grayScale[3]");
}

.room-info.dark {
  color: v-bind("darkColors.grayScale[4]");
}

.open-button,
.load-button,
.spinner {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  transition: all 0.3s ease-in-out;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: v-bind("balloonPosition?.top");
  left: v-bind("balloonPosition?.left");
  right: v-bind("balloonPosition?.right");
  bottom: v-bind("balloonPosition?.bottom");
}

.open-button,
.load-button,
.minimize-button {
  cursor: pointer;
  border-width: 0px;
}

.load-button {
  background-color: v-bind("lightColors.primary");
  color: v-bind("lightColors.grayScale[0]");
  fill: v-bind("lightColors.grayScale[0]");
}

.load-button.dark {
  background-color: v-bind("darkColors.primary");
  color: v-bind("darkColors.grayScale[5]");
  fill: v-bind("darkColors.grayScale[5]");
}

.load-button:hover {
  background-color: v-bind("lightColors.secondary");
  color: v-bind("lightColors.quaternary");
  fill: v-bind("lightColors.quaternary");
}

.load-button.dark:hover {
  background-color: v-bind("darkColors.tertiary");
  color: v-bind("darkColors.primary");
  fill: v-bind("darkColors.primary");
}

.open-button {
  background-color: v-bind("lightColors.primary");
  color: v-bind("lightColors.grayScale[0]");
  fill: v-bind("lightColors.grayScale[0]");
}

.open-button.dark {
  background-color: v-bind("darkColors.primary");
  color: v-bind("darkColors.grayScale[5]");
  fill: v-bind("darkColors.grayScale[5]");
}

.open-button:hover {
  background-color: v-bind("lightColors.secondary");
  color: v-bind("lightColors.quaternary");
  fill: v-bind("lightColors.quaternary");
}

.open-button.dark:hover {
  background-color: v-bind("darkColors.tertiary");
  color: v-bind("darkColors.primary");
  fill: v-bind("darkColors.primary");
}

.spinner {
  background-color: v-bind("lightColors.primary");
  color: v-bind("lightColors.quaternary");
  stroke: v-bind("lightColors.quaternary");
}

.spinner.dark {
  background-color: v-bind("darkColors.primary");
  color: v-bind("darkColors.tertiary");
  stroke: v-bind("darkColors.tertiary");
}

.minimize-button {
  margin-left: 32px;
  stroke: v-bind("lightColors.grayScale[3]");
  background: transparent;
}

.minimize-button.dark {
  stroke: v-bind("darkColors.grayScale[4]");
}

.minimize-button svg {
  vertical-align: middle;
}

.minimize-button:hover {
  stroke: v-bind("lightColors.secondary");
}

.minimize-button.dark:hover {
  stroke: v-bind("darkColors.tertiary");
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

.slideUp-enter-active {
  animation: translate-up 0.5s reverse;
}

.slideUp-leave-active {
  animation: translate-up 0.5s;
}

@keyframes translate-up {
  0% {
    transform: translateY(0%);
  }

  100% {
    transform: translateY(110%);
  }
}

.slideDown-enter-active {
  animation: translate-down 0.5s reverse;
}

.slideDown-leave-active {
  animation: translate-down 0.5s;
}

@keyframes translate-down {
  0% {
    transform: translateY(0%);
  }

  100% {
    transform: translateY(-110%);
  }
}

.slideLeft-enter-active {
  animation: translate-left 0.5s reverse;
}

.slideLeft-leave-active {
  animation: translate-left 0.5s;
}

@keyframes translate-left {
  0% {
    transform: translateX(0%);
  }

  100% {
    transform: translateX(110%);
  }
}

.slideRight-enter-active {
  animation: translate-right 0.5s reverse;
}

.slideRight-leave-active {
  animation: translate-right 0.5s;
}

@keyframes translate-right {
  0% {
    transform: translateX(0%);
  }

  100% {
    transform: translateX(-110%);
  }
}

.fade-enter-active {
  animation: fade-in 0.5s;
}

.fade-leave-active {
  animation: fade-in 0.5s reverse;
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
  animation: fastFade-in 0.5s;
}

.fastFade-leave-active {
  animation: fastFade-in 0.5s reverse;
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
