<script setup lang="ts">
import { ref, computed, TransitionGroup, watch, onMounted } from "vue";
import {
  sendMessage,
  getMessageList,
  getRoom,
  getMyID,
  getOptions,
  getStatus,
} from "../components/WakuLogic";
import { formatTimestamp } from "../utils/formatation";
import { scrollToBottom, scrollToMessage } from "../utils/animation";
import { WakuChatConfigCss } from "../types/ChatTypes";

const props = defineProps<{
  styleConfig?: WakuChatConfigCss;
  theme?: string;
  lightColors: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    grayScale: string[];
  };
  darkColors: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    grayScale: string[];
  };
  open: boolean;
  height: string;
  isLoading?: boolean;
}>();

const propsOpen = computed(() => {
  return props.open;
});

const isDark = computed(() => {
  return props.theme === "dark";
});

const height = computed(() => {
  return props.height;
});

const loadingRoom = ref<boolean>(false);
const messageInput = ref<string>("");
const showSystemMessages = ref<boolean>(false);
const userShowSystemMessages = ref<boolean>(false);
const messageContainerRef = ref<HTMLElement | null>(null);
const waitingMessage = ref<boolean>(false);
const responseTo = ref<number | undefined>(undefined);

const styleConfig = computed(() => {
  return props.styleConfig;
});

const groupedMessages = computed(() => {
  let groupMessagesTime = getOptions()?.groupMessagesTime;
  groupMessagesTime = groupMessagesTime ? groupMessagesTime : 1 * 60 * 1000;

  const filteredMessages = getMessageList().filter((message) => {
    return message.room === getRoom() && message.type !== "reaction";
  });

  if (!filteredMessages[0]) return [];

  const groupedMsgs = [];
  let currentGroup = [filteredMessages[0]];

  for (let i = 1; i < filteredMessages.length; i++) {
    const currentMsg = filteredMessages[i];
    const previousMsg = filteredMessages[i - 1];

    if (
      currentMsg.author.id === previousMsg.author.id &&
      currentMsg.author.name === previousMsg.author.name &&
      currentMsg.type !== "system" &&
      previousMsg.type !== "system" &&
      !currentMsg.responseTo &&
      Math.abs(previousMsg.timestamp - currentMsg.timestamp) <=
        groupMessagesTime
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

const reactions = computed(() => {
  return getMessageList().filter((message) => {
    return message.room === getRoom() && message.type === "reaction";
  });
});

const room = computed(() => {
  return getRoom();
});

// watch([propsOpen, room], () => {
//   if (propsOpen) {
//     setTimeout(() => {
//       scrollToBottom(messageContainerRef.value);
//     }, 0);
//   }
// });

// watch([groupedMessages], () => {
//   if (waitingMessage.value) {
//     waitingMessage.value = false;
//     setTimeout(() => {
//       scrollToBottom(messageContainerRef.value);
//     }, 0);
//   }
// });

// onMounted(() => {
//   setTimeout(() => {
//     scrollToBottom(messageContainerRef.value);
//   }, 0);
// });

const handleSendMessage = () => {
  if (messageInput.value) {
    var responseId =
      responseTo.value !== undefined
        ? groupedMessages.value[responseTo.value][0].id
        : undefined;
    sendMessage(messageInput.value, "text", responseId);
    responseTo.value = undefined;
  }
  messageInput.value = "";
  waitingMessage.value = true;
  scrollToBottom(messageContainerRef.value);
};

const checkPreviousMsgName = (idx: number) => {
  return !(
    idx > 0 &&
    groupedMessages.value[idx - 1][0].type === "text" &&
    groupedMessages.value[idx][0].author.id ===
      groupedMessages.value[idx - 1][0].author.id &&
    groupedMessages.value[idx][0].author.name ===
      groupedMessages.value[idx - 1][0].author.name &&
    groupedMessages.value[idx][0].author.type ===
      groupedMessages.value[idx - 1][0].author.type
  );
};

const getMessageReactions = (msgId: string) => {
  const lastReactionsByAuthor: Map<string, string> = new Map();
  reactions.value.forEach((reaction) => {
    if (reaction.responseTo === msgId) {
      lastReactionsByAuthor.set(reaction.author.id, reaction.data);
    }
  });

  const reacts: { reaction: string; quantity: number }[] = [];
  lastReactionsByAuthor.forEach((reaction) => {
    const index = reacts.findIndex((react) => react.reaction === reaction);
    if (index !== -1) {
      reacts[index].quantity++;
    } else {
      reacts.push({ reaction: reaction, quantity: 1 });
    }
  });
  return reacts;
};

const messageReacted = (messageId: string) => {
  for (var i = reactions.value.length - 1; i >= 0; i--) {
    if (
      reactions.value[i].author.id === getMyID() &&
      reactions.value[i].responseTo === messageId
    ) {
      if (reactions.value[i].data !== "none") {
        return true;
      } else {
        return false;
      }
    }
  }
  return false;
};

const reactMessage = (groupedMsgIdx: number, reaction: string) => {
  var messageId = groupedMessages.value[groupedMsgIdx][0].id;
  sendMessage(reaction, "reaction", messageId);
};

const setResponse = (groupedMsgIdx: number | undefined) => {
  responseTo.value = groupedMsgIdx;
};

const groupedResponse = (id: string) => {
  for (var i = 0; i < groupedMessages.value.length; i++) {
    if (groupedMessages.value[i][0].id === id) {
      return groupedMessages.value[i];
    }
  }
  return [];
};

const printSystemMessage = (msg: any) => {
  if (msg.data === "enter") {
    return `${msg.author.name} just entered the room`;
  } else if (msg.data === "leave") {
    return `${msg.author.name} just left the room`;
  } else if (msg.data.indexOf("changeName:") !== -1) {
    return `${msg.data.split("changeName:")[1]} changed its name to ${
      msg.author.name
    }`;
  }
  return "";
};
</script>

<template>
  <div class="main-container" :class="{ dark: isDark }">
    <div class="status-indicator">
      {{ getStatus() === 'connected' ? '' : getStatus() === 'connecting' ? 'connecting...' : 'disconnected' }}
    </div>
          <!-- Skeleton Messages -->
      <Transition name="fade" mode="out-in">
        <div v-if="props.isLoading" class="chat-body" :class="{ dark: isDark }" ref="messageContainerRef">
          <div
            v-for="i in 3"
            :key="'skeleton-'+i"
            class="message-container"
            :class="{ dark: isDark }"
          >
            <!-- Username skeleton -->
            <div class="user-name-baloon" :class="{ dark: isDark }">
              <div class="skeleton-content" style="width: 80px"></div>
            </div>

            <!-- Message bubble skeleton -->
            <div class="grouped-message" :class="{ dark: isDark }">
              <div class="message skeleton-content" :class="{ dark: isDark }">
                <div style="width: 160px; height: 16;"></div>
                <div style="width: 160px; height: 16;"></div>
              </div>
            </div>

            <!-- Timestamp skeleton -->
            <div class="timestamp" :class="{ dark: isDark }">
              <div class="skeleton-content" style="width: 60px"></div>
            </div>
          </div>
        </div>
      <div v-else class="chat-body" :class="{ dark: isDark }" ref="messageContainerRef">
      <!-- Actual Messages -->
      <TransitionGroup name="fade" mode="out-in">
        <div v-if="!props.isLoading"
          v-for="(groupedMsgs, idGroup) in groupedMessages"
          :key="groupedMsgs[0].id"
          :class="{
            'own-message': groupedMsgs[0].author.id === getMyID(),
            dark: isDark,
          }"
          class="message-container"
          :id="groupedMsgs[0].id"
        >
          <Transition name="fade" mode="out-in">
            <div
              v-if="
                groupedMsgs[0].type === 'text' && checkPreviousMsgName(idGroup)
              "
              class="user-name-baloon"
              :class="{ dark: isDark }"
            >
              <div>{{ groupedMsgs[0].author.name }}</div>
              <div v-if="groupedMsgs[0].author.type" class="user-type">
                {{ groupedMsgs[0].author.type }}
              </div>
            </div>
          </Transition>
          <Transition name="fade" mode="out-in">
            <div
              v-if="groupedMsgs[0].type === 'text'"
              class="grouped-message"
              :class="{ dark: isDark }"
            >
              <button
                class="interact-button"
                v-if="groupedMsgs[0].author.id === getMyID()"
                @click="setResponse(idGroup)"
              >
                <svg
                  width="14"
                  height="12"
                  viewBox="0 0 14 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 4.75H7.66667C10.6122 4.75 13 6.98858 13 9.75V11M1 4.75L5 8.5M1 4.75L5 1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
              <button
                class="interact-button"
                v-if="
                  !messageReacted(groupedMsgs[0].id) &&
                  groupedMsgs[0].author.id === getMyID()
                "
                @click="reactMessage(idGroup, 'like')"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.5 11V5.4253M1 6.5V10C1 10.5523 1.45911 11 2.02544 11H8.90935C9.66854 11 10.3142 10.4598 10.4296 9.72809L10.9818 6.22809C11.1251 5.31945 10.4042 4.5 9.46151 4.5H7.66536C7.3822 4.5 7.15264 4.27614 7.15264 4V2.23292C7.15264 1.552 6.5866 1 5.88836 1C5.72181 1 5.57089 1.09565 5.50325 1.24406L3.69893 5.20307C3.61664 5.38363 3.43302 5.5 3.2304 5.5H2.02544C1.45911 5.5 1 5.94772 1 6.5Z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
              <div class="message" :class="{ dark: isDark }">
                <TransitionGroup name="fade">
                  <div
                    v-if="
                      groupedMsgs[0].responseTo &&
                      groupedResponse(groupedMsgs[0].responseTo).length <= 0
                    "
                    class="grouped-message grouped-response response-disabled"
                    :class="{ dark: isDark }"
                  >
                    Couldn&apos;t load the message
                  </div>
                  <div
                    v-else-if="groupedMsgs[0].responseTo"
                    @click="
                      scrollToMessage(
                        groupedMsgs[0].responseTo,
                        messageContainerRef
                      )
                    "
                    class="grouped-message grouped-response"
                    :class="{ dark: isDark }"
                  >
                    <div class="user-name-baloon" :class="{ dark: isDark }">
                      <div>
                        {{
                          groupedResponse(groupedMsgs[0].responseTo)[0].author
                            .name
                        }}
                      </div>
                      <div
                        v-if="
                          groupedResponse(groupedMsgs[0].responseTo)[0].author
                            .type
                        "
                        class="user-type"
                      >
                        {{
                          groupedResponse(groupedMsgs[0].responseTo)[0].author
                            .type
                        }}
                      </div>
                    </div>
                    <div class="message" :class="{ dark: isDark }">
                      <div
                        v-for="(message, idMsg) in groupedResponse(
                          groupedMsgs[0].responseTo
                        ).slice(0, 4)"
                        :key="idMsg"
                        class="message-content"
                      >
                        {{ message.data }}
                      </div>
                      <div
                        v-if="
                          groupedResponse(groupedMsgs[0].responseTo).length > 4
                        "
                        class="message-content"
                      >
                        ...
                      </div>
                    </div>
                  </div>
                </TransitionGroup>
                <TransitionGroup name="fade">
                  <div
                    v-for="(message, idxMsg) in groupedMsgs"
                    class="message-content"
                    :key="idxMsg"
                  >
                    {{ message.data }}
                  </div>
                  <div
                    v-for="(msgReact, idxReact) in getMessageReactions(
                      groupedMsgs[0].id
                    )"
                    class="message-react"
                    :class="{ dark: isDark }"
                    :key="idxReact"
                  >
                    <button
                      v-if="msgReact.reaction === 'like'"
                      @click="reactMessage(idGroup, 'none')"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3.5 11V5.4253M1 6.5V10C1 10.5523 1.45911 11 2.02544 11H8.90935C9.66854 11 10.3142 10.4598 10.4296 9.72809L10.9818 6.22809C11.1251 5.31945 10.4042 4.5 9.46151 4.5H7.66536C7.3822 4.5 7.15264 4.27614 7.15264 4V2.23292C7.15264 1.552 6.5866 1 5.88836 1C5.72181 1 5.57089 1.09565 5.50325 1.24406L3.69893 5.20307C3.61664 5.38363 3.43302 5.5 3.2304 5.5H2.02544C1.45911 5.5 1 5.94772 1 6.5Z"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      <div>{{ msgReact.quantity }}</div>
                    </button>
                  </div>
                </TransitionGroup>
              </div>
              <TransitionGroup name="fade">
                <button
                  class="interact-button"
                  v-if="
                    !messageReacted(groupedMsgs[0].id) &&
                    groupedMsgs[0].author.id !== getMyID()
                  "
                  @click="reactMessage(idGroup, 'like')"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.5 11V5.4253M1 6.5V10C1 10.5523 1.45911 11 2.02544 11H8.90935C9.66854 11 10.3142 10.4598 10.4296 9.72809L10.9818 6.22809C11.1251 5.31945 10.4042 4.5 9.46151 4.5H7.66536C7.3822 4.5 7.15264 4.27614 7.15264 4V2.23292C7.15264 1.552 6.5866 1 5.88836 1C5.72181 1 5.57089 1.09565 5.50325 1.24406L3.69893 5.20307C3.61664 5.38363 3.43302 5.5 3.2304 5.5H2.02544C1.45911 5.5 1 5.94772 1 6.5Z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
                <button
                  class="interact-button"
                  v-if="groupedMsgs[0].author.id !== getMyID()"
                  @click="setResponse(idGroup)"
                >
                  <svg
                    width="14"
                    height="12"
                    viewBox="0 0 14 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 4.75H7.66667C10.6122 4.75 13 6.98858 13 9.75V11M1 4.75L5 8.5M1 4.75L5 1"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </TransitionGroup>
            </div>
            <div
              v-else-if="
                showSystemMessages &&
                userShowSystemMessages &&
                groupedMsgs[0].type === 'system'
              "
              class="system-message"
              :class="{ dark: isDark }"
            >
              <TransitionGroup name="fade">
                <div
                  v-for="(message, idMsg) in groupedMsgs"
                  class="message-content"
                  :key="idMsg"
                >
                  {{ printSystemMessage(message) }}
                </div>
              </TransitionGroup>
            </div>
          </Transition>
          <Transition name="fade" mode="out-in">
            <div
              v-if="groupedMsgs[0].type === 'text'"
              class="timestamp"
              :class="{ dark: isDark }"
            >
              {{
                formatTimestamp(groupedMsgs[groupedMsgs.length - 1].timestamp)
              }}
            </div>
          </Transition>
        </div>
      </TransitionGroup>
    </div>
    </Transition>
    <div
      :class="`chat-footer ${
        responseTo !== undefined ? 'footer-response' : ''
      } ${isDark ? 'dark' : ''}`"
    >
      <Transition name="fade">
        <div
          v-if="responseTo !== undefined"
          :class="`response-input ${isDark ? 'dark' : ''}`"
        >
          <div>
            <div class="user-name-baloon" :class="{ dark: isDark }">
              <div>
                {{ groupedMessages[responseTo][0].author.name }}
              </div>
              <div
                v-if="groupedMessages[responseTo][0].author.type"
                class="user-type"
              >
                {{ groupedMessages[responseTo][0].author.type }}
              </div>
            </div>
            <TransitionGroup name="fade">
              <div
                v-for="(message, idMsg) in groupedMessages[responseTo].slice(
                  0,
                  1
                )"
                :key="idMsg"
              >
                {{ message.data }}
              </div>
              <div v-if="groupedMessages[responseTo].length > 1">...</div>
            </TransitionGroup>
          </div>
          <button @click="setResponse(undefined)">
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
      </Transition>
      <div class="message-input" :class="{ dark: isDark }">
        <input
          v-model="messageInput"
          placeholder="Type your message..."
          @keypress.enter="handleSendMessage"
          :disabled="loadingRoom"
        />
        <button
          @click="handleSendMessage"
          class="send-button"
          :class="{ dark: isDark }"
          :disabled="loadingRoom || !messageInput"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="current"
          >
            <path
              d="M20.3534 10.9267C21.2378 11.3689 21.2378 12.6311 20.3534 13.0733L4.61964 20.9402C3.59859 21.4507 2.50875 20.3816 2.99955 19.351L6.25432 12.5159C6.40974 12.1895 6.40974 11.8105 6.25432 11.4841L2.99955 4.64905C2.50875 3.61837 3.59859 2.54929 4.61964 3.05982L20.3534 10.9267Z"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="css">
.main-container {
  display: flex;
  flex-direction: column;
  height: v-bind("height");
  border-radius: 8px;
  background-color: v-bind("lightColors.grayScale[0]");
}

.main-container.dark {
  background-color: v-bind("darkColors.grayScale[0]");
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 1px 0px 16px;
  margin-right: 15px;  
  display: flex;
  flex-direction: column-reverse;
}

.chat-body::-webkit-scrollbar {
  width: 5px;
}

.chat-body::-webkit-scrollbar-thumb {
  background-color: v-bind("lightColors.secondary");
  border-radius: 5px;
}

.chat-body.dark::-webkit-scrollbar-thumb {
  background-color: v-bind("darkColors.secondary");
}

.chat-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  background-color: v-bind("lightColors.grayScale[0]");
}

.chat-footer.dark {
  background-color: v-bind("darkColors.grayScale[0]");
}

.footer-response {
  background-color: v-bind("lightColors.quaternary");
}

.footer-response.dark {
  background-color: v-bind("darkColors.primary");
}

.response-input {
  width: 100%;
  margin-bottom: 8px;
  display: flex;
}

.response-input .user-name-baloon {
  margin-left: auto;
  color: v-bind("lightColors.tertiary");
}

.response-input.dark .user-name-baloon {
  color: v-bind("darkColors.tertiary");
}

.response-input > div {
  padding: 4px 8px;
  border-radius: 8px;
  max-width: 67%;
  background-color: v-bind("lightColors.secondary");
  color: v-bind("lightColors.grayScale[1]");
}

.response-input.dark > div {
  background-color: v-bind("darkColors.quaternary");
  color: v-bind("darkColors.grayScale[4]");
}

.response-input > div > div {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.response-input button {
  stroke: v-bind("lightColors.grayScale[3]");
  align-self: center;
  margin-left: auto;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
}

.response-input.dark button {
  stroke: v-bind("darkColors.grayScale[4]");
}

.response-input button:hover {
  stroke: v-bind("lightColors.secondary");
}

.response-input.dark button:hover {
  stroke: v-bind("darkColors.quaternary");
}

.message-input {
  display: flex;
  width: 100%;
  height: 48px;
  line-height: 16px;
  border-radius: 8px;
  color: v-bind("lightColors.grayScale[5]");
  background-color: v-bind("lightColors.grayScale[1]");
}

.message-input.dark {
  color: v-bind("darkColors.grayScale[5]");
  background-color: v-bind("darkColors.grayScale[1]");
}

.message-input input {
  width: 100%;
  outline: none;
  border: none;
  margin-left: 12px;
  color: v-bind("lightColors.grayScale[5]");
  background-color: v-bind("lightColors.grayScale[1]");
}

.message-input.dark input {
  color: v-bind("darkColors.grayScale[5]");
  background-color: v-bind("darkColors.grayScale[1]");
}

.message-input input::placeholder {
  color: v-bind("lightColors.grayScale[2]");
  opacity: 1;
}

.message-input.dark input::placeholder {
  color: v-bind("darkColors.grayScale[2]");
}

.message-input input::-ms-input-placeholder {
  color: v-bind("lightColors.grayScale[2]");
}

.message-input.dark input::-ms-input-placeholder {
  color: v-bind("darkColors.grayScale[2]");
}

.message-input button {
  margin-left: auto;
  margin-right: 12px;
}

.send-button {
  cursor: pointer;
  border-width: 0px;
}

.send-button {
  background: transparent;
  margin-top: 4px;
}

.send-button svg {
  fill: v-bind("lightColors.primary");
  color: v-bind("lightColors.primary");
}

.send-button.dark svg {
  fill: v-bind("darkColors.primary");
  color: v-bind("darkColors.primary");
}

.send-button:hover svg {
  fill: v-bind("lightColors.secondary");
  color: v-bind("lightColors.grayScale[1]");
}

.send-button.dark:hover svg {
  fill: v-bind("darkColors.secondary");
  color: v-bind("darkColors.grayScale[1]");
}

.send-button:disabled {
  cursor: auto;
}

.send-button:disabled svg {
  fill: v-bind("lightColors.grayScale[4]");
  color: v-bind("lightColors.grayScale[4]");
}

.send-button.dark:disabled svg {
  fill: v-bind("darkColors.grayScale[4]");
  color: v-bind("darkColors.grayScale[4]");
}

.own-message .message {
  background-color: v-bind("lightColors.primary");
  font-weight: 400;
  color: v-bind("lightColors.grayScale[1]");
}

.own-message.dark .message {
  background-color: v-bind("darkColors.primary");
  color: v-bind("darkColors.grayScale[5]");
}

.own-message .timestamp {
  margin-left: auto;
}

.own-message .user-name-baloon {
  margin-left: auto;
  color: v-bind("lightColors.primary");
}

.own-message.dark .user-name-baloon {
  color: v-bind("darkColors.secondary");
}

.user-name-baloon {
  font-size: 10px !important;
  display: flex;
  align-items: center;
  line-height: 12px;
  margin-bottom: 4px;
  color: v-bind("lightColors.grayScale[4]");
}

.user-name-baloon.dark {
  color: v-bind("darkColors.grayScale[4]");
}

.user-name-baloon .user-type {
  border-radius: 12px;
  background: v-bind("lightColors.quaternary");
  color: v-bind("lightColors.grayScale[5]");
  padding: 4px 8px;
  margin-left: 4px;
}

.message-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.message {
  position: relative;
  line-height: 16px;
  min-width: 96px;
  max-width: 67%;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: v-bind("lightColors.grayScale[1]");
  color: v-bind("lightColors.grayScale[5]");
  box-shadow: 0px 1px 3px 0px
    rgba(0, 0, 0, v-bind("styleConfig?.shadows.messageBalloon"));
  display: flex;  
  flex-direction: column-reverse;
}

.message-content {
  order: -1;
}

.message.dark {
  background-color: v-bind("darkColors.grayScale[1]");
  color: v-bind("darkColors.grayScale[5]");
}

.grouped-response {
  background-color: v-bind("lightColors.grayScale[3]");
  color: v-bind("lightColors.grayScale[1]");
  margin-bottom: 8px;
  border-radius: 4px;
  padding: 4px 8px 8px 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.grouped-response.dark {
  background-color: v-bind("darkColors.grayScale[3]");
  color: v-bind("darkColors.grayScale[1]");
}

.grouped-response .message {
  max-width: 100%;
  margin-left: 0;
  background-color: v-bind("lightColors.grayScale[3]");
  color: v-bind("lightColors.grayScale[1]");
  box-shadow: none;
  padding: 0px;
}

.grouped-response.dark .message {
  background-color: v-bind("darkColors.grayScale[3]");
  color: v-bind("darkColors.grayScale[5]");
}

.own-message .grouped-response {
  background-color: v-bind("lightColors.secondary");
}

.own-message.dark .grouped-response {
  background-color: v-bind("darkColors.quaternary");
}

.own-message .grouped-response .message {
  width: 100%;
  background-color: v-bind("lightColors.secondary");
  color: v-bind("lightColors.grayScale[1]");
}

.own-message.dark .grouped-response .message {
  background-color: v-bind("darkColors.quaternary");
  color: v-bind("darkColors.grayScale[4]");
}

.grouped-response .user-name-baloon {
  margin-bottom: 8px;
  margin-left: 0px;
  color: v-bind("lightColors.grayScale[1]");
}

.grouped-response.dark .user-name-baloon {
  color: v-bind("darkColors.grayScale[4]");
}

.own-message .grouped-response .user-name-baloon {
  color: v-bind("lightColors.tertiary");
}

.own-message.dark .grouped-response .user-name-baloon {
  color: v-bind("darkColors.tertiary");
}

.grouped-message {
  display: flex;
}

.response-disabled {
  font-style: italic;
  cursor: default;
}

.interact-button {
  align-self: center;
  margin-right: 4px;
  margin-left: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 100%;
  width: 24px;
  height: 24px;
}

.grouped-message:hover > .interact-button:hover {
  stroke: v-bind("lightColors.grayScale[1]");
  background-color: v-bind("lightColors.secondary");
}

.grouped-message.dark:hover > .interact-button:hover {
  stroke: v-bind("darkColors.grayScale[1]");
  background-color: v-bind("darkColors.tertiary");
}

.grouped-message button:first-child {
  margin-right: auto;
  margin-left: 4px;
}

.grouped-message:hover > .interact-button {
  stroke: v-bind("lightColors.grayScale[5]");
  background-color: v-bind("lightColors.grayScale[1]");
}

.grouped-message.dark:hover > .interact-button {
  stroke: v-bind("darkColors.grayScale[5]");
  background-color: v-bind("darkColors.grayScale[1]");
}

.own-message .interact-button {
  align-self: center;
  margin-right: 4px;
  margin-left: 4px;
  transform: scaleX(1);
}

.own-message .grouped-message button:first-child {
  margin-left: auto;
  margin-right: 4px;
}

.system-message {
  line-height: 16px;
  min-width: 96px;
  width: 80%;
  padding: 2px 8px 2px 8px;
  margin: 8px;
  border-radius: 4px;
  align-self: center !important;
  text-align: center;
  background-color: v-bind("lightColors.grayScale[1]");
  color: v-bind("lightColors.primary");
  box-shadow: 0px 1px 3px 0px
    rgba(0, 0, 0, v-bind("styleConfig?.shadows.messageBalloon"));
}

.system-message.dark {
  background-color: v-bind("darkColors.grayScale[1]");
  color: v-bind("darkColors.primary");
}

.timestamp {
  color: v-bind("lightColors.grayScale[4]");
  margin: 8px 0px 8px 0px;
  font-size: 9px !important;
  line-height: 9px;
  margin-bottom: 16px;
}

.timestamp.dark {
  color: v-bind("darkColors.grayScale[4]");
}

.message-content {
  word-wrap: break-word;
}

.message-react {
  position: absolute;
  bottom: -16px;
  right: 0px;
}

.own-message .message-react {
  right: none;
  left: 0px;
}

.message-react button {
  padding: 4px 8px 4px 8px;
  display: inline-flex;
  background: v-bind("lightColors.secondary");
  border-radius: 12px;
  border: none;
  cursor: pointer;
  color: v-bind("lightColors.grayScale[1]");
  stroke: v-bind("lightColors.grayScale[1]");
}

.message-react.dark button {
  background: v-bind("darkColors.secondary");
  color: v-bind("darkColors.grayScale[1]");
  stroke: v-bind("darkColors.grayScale[1]");
}

.message-react button div {
  padding-left: 4px;
  font-size: 9px;
  align-self: self-end;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.slide-enter-active {
  animation: translate-out 0.5s reverse;
}

.slide-leave-active {
  animation: translate-out 0.5s;
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

.status-indicator{
  text-align: left;
  font-size: 10px;
  color: v-bind("lightColors.grayScale[3]");
  pointer-events: none;
  position: absolute;
  bottom: 5px;
  right: 20px;
}

.observer-target {
  height: 20px;
  width: 100%;
}

.loading-indicator {
  text-align: center;
  padding: 10px;
  color: v-bind("lightColors.grayScale[3]");
}

.skeleton-content {
  min-height: 16px;
  background-color: v-bind("lightColors.grayScale[1]");
  border-radius: 4px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.dark .skeleton-content {
  background-color: v-bind("darkColors.grayScale[1]");
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
</style>
