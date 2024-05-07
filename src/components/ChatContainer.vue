<script setup lang="ts">
import { ref, computed, TransitionGroup, onBeforeUnmount, watch, onMounted } from "vue";
import {
  sendMessage,
  getMessageList,
  getRoom,
  getMyID,
  getOptions,
  onDestroyWaku,
} from "../components/WakuLogic"
import { formatTimestamp } from "../utils/formatation";
import { scrollToBottom, scrollToMessage } from "../utils/animation";

const props = defineProps<{
  cssConfiguration: any;
  open: boolean;
}>()

const propsOpen = computed(() => {
  return props.open
});

const loadingRoom = ref<boolean>(false);
const messageInput = ref<string>('');
const showSystemMessages = ref<boolean>(false);
const userShowSystemMessages = ref<boolean>(false);
const messageContainerRef = ref<HTMLElement | null>(null);
const waitingMessage = ref<boolean>(false);
const responseTo = ref<number | undefined>(undefined);

const cssConfiguration = computed(() => {
  return props.cssConfiguration
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

const reactions = computed(() => {
  return getMessageList().filter(message => {
    return message.room === getRoom() && message.type === 'reaction';
  })
})

watch([propsOpen], () => {
  if (propsOpen) {
    setTimeout(() => {
      scrollToBottom(messageContainerRef.value)
    }, 0);
  }
});

watch([groupedMessages], () => {
  if (waitingMessage.value) {
    waitingMessage.value = false
    setTimeout(() => {
      scrollToBottom(messageContainerRef.value)
    }, 0);
  }
});

onMounted(() => {
  setTimeout(() => {
    scrollToBottom(messageContainerRef.value)
  }, 0);
})

onBeforeUnmount(() => {
  onDestroyWaku();
});

const handleSendMessage = () => {
  if (messageInput.value) {
    var responseId = responseTo.value !== undefined ? groupedMessages.value[responseTo.value][0].id : undefined
    sendMessage(messageInput.value, 'text', responseId)
    responseTo.value = undefined
  }
  messageInput.value = ''
  waitingMessage.value = true
}

const checkPreviousMsgName = (idx: number) => {
  return !(idx > 0
    && groupedMessages.value[idx - 1][0].type === 'text'
    && groupedMessages.value[idx][0].author.id === groupedMessages.value[idx - 1][0].author.id
    && groupedMessages.value[idx][0].author.name === groupedMessages.value[idx - 1][0].author.name)
}

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

const messageReacted = (messageId: string) => {
  for (var i = reactions.value.length - 1; i >= 0; i--) {
    if (reactions.value[i].author.id === getMyID() && reactions.value[i].responseTo === messageId) {
      if (reactions.value[i].data !== 'none') {
        return true
      } else {
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

const setResponse = (groupedMsgIdx: number | undefined) => {
  responseTo.value = groupedMsgIdx
}

const groupedResponse = (id: string) => {
  for (var i = 0; i < groupedMessages.value.length; i++) {
    if (groupedMessages.value[i][0].id === id) {
      return groupedMessages.value[i]
    }
  }
  return []
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

</script>

<template>
  <div class="main-container">
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
          <Transition name="fade">
            <div v-if="groupedMsgs[0].type === 'text'" class="grouped-message">
              <button class="interact-button" v-if="groupedMsgs[0].author.id === getMyID()"
                @click="setResponse(idGroup)">
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4.75H7.66667C10.6122 4.75 13 6.98858 13 9.75V11M1 4.75L5 8.5M1 4.75L5 1"
                    stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <button class="interact-button"
                v-if="!messageReacted(groupedMsgs[0].id) && groupedMsgs[0].author.id === getMyID()"
                @click="reactMessage(idGroup, 'like')">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M3.5 11V5.4253M1 6.5V10C1 10.5523 1.45911 11 2.02544 11H8.90935C9.66854 11 10.3142 10.4598 10.4296 9.72809L10.9818 6.22809C11.1251 5.31945 10.4042 4.5 9.46151 4.5H7.66536C7.3822 4.5 7.15264 4.27614 7.15264 4V2.23292C7.15264 1.552 6.5866 1 5.88836 1C5.72181 1 5.57089 1.09565 5.50325 1.24406L3.69893 5.20307C3.61664 5.38363 3.43302 5.5 3.2304 5.5H2.02544C1.45911 5.5 1 5.94772 1 6.5Z"
                    stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <div class="message">
                <TransitionGroup name="fade">
                  <div v-if="groupedMsgs[0].responseTo && groupedResponse(groupedMsgs[0].responseTo).length <= 0"
                    class="grouped-message grouped-response response-disabled">
                    Couldn&apos;t load the message
                  </div>
                  <div v-else-if="groupedMsgs[0].responseTo"
                    @click="scrollToMessage(groupedMsgs[0].responseTo, messageContainerRef)"
                    class="grouped-message grouped-response">
                    <span class="user-name-baloon">
                      {{ groupedResponse(groupedMsgs[0].responseTo)[0].author.name }}
                    </span>
                    <div class="message">
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
                <TransitionGroup name="fade">
                  <div v-for="(message, idxMsg) in groupedMsgs" class="message-content" :key="idxMsg">
                    {{ message.data }}
                  </div>
                  <div v-for="(msgReact, idxReact) in getMessageReactions(groupedMsgs[0].id)" class="message-react"
                    :key="idxReact">
                    <button v-if="msgReact.reaction === 'like'" @click="reactMessage(idGroup, 'none')">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M3.5 11V5.4253M1 6.5V10C1 10.5523 1.45911 11 2.02544 11H8.90935C9.66854 11 10.3142 10.4598 10.4296 9.72809L10.9818 6.22809C11.1251 5.31945 10.4042 4.5 9.46151 4.5H7.66536C7.3822 4.5 7.15264 4.27614 7.15264 4V2.23292C7.15264 1.552 6.5866 1 5.88836 1C5.72181 1 5.57089 1.09565 5.50325 1.24406L3.69893 5.20307C3.61664 5.38363 3.43302 5.5 3.2304 5.5H2.02544C1.45911 5.5 1 5.94772 1 6.5Z"
                          stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      <div>{{ msgReact.quantity }}</div>
                    </button>
                  </div>
                </TransitionGroup>
              </div>
              <TransitionGroup name="fade">
                <button class="interact-button"
                  v-if="!messageReacted(groupedMsgs[0].id) && groupedMsgs[0].author.id !== getMyID()"
                  @click="reactMessage(idGroup, 'like')">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3.5 11V5.4253M1 6.5V10C1 10.5523 1.45911 11 2.02544 11H8.90935C9.66854 11 10.3142 10.4598 10.4296 9.72809L10.9818 6.22809C11.1251 5.31945 10.4042 4.5 9.46151 4.5H7.66536C7.3822 4.5 7.15264 4.27614 7.15264 4V2.23292C7.15264 1.552 6.5866 1 5.88836 1C5.72181 1 5.57089 1.09565 5.50325 1.24406L3.69893 5.20307C3.61664 5.38363 3.43302 5.5 3.2304 5.5H2.02544C1.45911 5.5 1 5.94772 1 6.5Z"
                      stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
                <button class="interact-button" v-if="groupedMsgs[0].author.id !== getMyID()"
                  @click="setResponse(idGroup)">
                  <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4.75H7.66667C10.6122 4.75 13 6.98858 13 9.75V11M1 4.75L5 8.5M1 4.75L5 1"
                      stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </TransitionGroup>
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
    <div :class="`chat-footer ${responseTo !== undefined ? 'footer-response' : ''}`">
      <Transition name="fade">
        <div v-if="responseTo !== undefined" class="response-input">
          <div>
            <span class="user-name-baloon">
              {{ groupedMessages[responseTo][0].author.name }}
            </span>
            <TransitionGroup name="fade">
              <div v-for="(message, idMsg) in groupedMessages[responseTo].slice(0, 1)" :key="idMsg">{{
                message.data
              }}
              </div>
              <div v-if="groupedMessages[responseTo].length > 1">...</div>
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
</template>

<style scoped lang="css">
.main-container {
  display: flex;
  flex-direction: column;
  height: 557px;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 1px 0px 16px;
  margin-right: 15px;
}

.chat-body::-webkit-scrollbar {
  width: 5px;
}

.chat-body::-webkit-scrollbar-thumb {
  background-color: v-bind('cssConfiguration.colors.border');
  border-radius: 5px;
}

.chat-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  background-color: v-bind('cssConfiguration.colors.footer.main');
}

.footer-response {
  background-color: v-bind('cssConfiguration.colors.footer.response');
}

.response-input {
  width: 100%;
  margin-bottom: 8px;
  display: flex;
}

.response-input .user-name-baloon {
  margin-left: auto;
  color: v-bind('cssConfiguration.colors.input.response.user');
}

.response-input>div {
  padding: 4px 8px;
  border-radius: 8px;
  max-width: 67%;
  background-color: v-bind('cssConfiguration.colors.input.response.main');
  color: v-bind('cssConfiguration.colors.input.response.text');
}

.response-input>div>div {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.response-input button {
  stroke: v-bind('cssConfiguration.colors.input.response.close');
  align-self: center;
  margin-left: auto;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
}

.response-input button:hover {
  stroke: v-bind('cssConfiguration.colors.input.response.closeHover');
}

.message-input {
  display: flex;
  width: 100%;
  height: 48px;
  line-height: 16px;
  border-radius: 8px;
  background-color: v-bind('cssConfiguration.colors.input.main');
}

.message-input input {
  width: 100%;
  outline: none;
  border: none;
  margin-left: 12px;
  color: v-bind('cssConfiguration.colors.input.text');
  background-color: v-bind('cssConfiguration.colors.input.main');
}

.message-input input::placeholder {
  color: v-bind('cssConfiguration.colors.input.placeholder');
  opacity: 1;
}

.message-input input::-ms-input-placeholder {
  color: v-bind('cssConfiguration.colors.input.placeholder');
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
  fill: v-bind('cssConfiguration.colors.sendBtn.main');
  color: v-bind('cssConfiguration.colors.sendBtn.text');
}

.send-button:hover svg {
  fill: v-bind('cssConfiguration.colors.sendBtn.hover');
  color: v-bind('cssConfiguration.colors.sendBtn.textHover');
}

.send-button:disabled {
  cursor: auto;
}

.send-button:disabled svg {
  fill: v-bind('cssConfiguration.colors.sendBtn.disabled');
  color: v-bind('cssConfiguration.colors.sendBtn.text');
}

.own-message .message {
  background-color: v-bind('cssConfiguration.colors.chat.myMessage.main');
  font-weight: 400;
  color: v-bind('cssConfiguration.colors.chat.myMessage.text');
}

.own-message .timestamp {
  margin-left: auto;
}

.own-message .user-name-baloon {
  margin-left: auto;
  color: v-bind('cssConfiguration.colors.chat.myMessage.user');
}

.user-name-baloon {
  font-size: 10px !important;
  line-height: 12px;
  margin-bottom: 4px;
  color: v-bind('cssConfiguration.colors.chat.otherMessage.user');
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
  background-color: v-bind('cssConfiguration.colors.chat.otherMessage.main');
  color: v-bind('cssConfiguration.colors.chat.otherMessage.text');
  box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, v-bind('cssConfiguration.shadows.messageBalloon'));
}

.grouped-response {
  background-color: v-bind('cssConfiguration.colors.chat.otherMessage.response.main');
  color: v-bind('cssConfiguration.colors.chat.otherMessage.response.text');
  margin-bottom: 8px;
  border-radius: 4px;
  padding: 4px 8px 8px 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.grouped-response .message {
  background-color: v-bind('cssConfiguration.colors.chat.otherMessage.response.main');
  color: v-bind('cssConfiguration.colors.chat.otherMessage.response.text');
  padding: 0px;
}

.own-message .grouped-response {
  background-color: v-bind('cssConfiguration.colors.chat.myMessage.response.main');
}

.own-message .grouped-response .message {
  margin-left: auto;
  background-color: v-bind('cssConfiguration.colors.chat.myMessage.response.main');
  color: v-bind('cssConfiguration.colors.chat.myMessage.response.text');
}

.grouped-response .user-name-baloon {
  margin-bottom: 8px;
  margin-left: 0px;
  color: v-bind('cssConfiguration.colors.chat.otherMessage.response.user');
}

.own-message .grouped-response .user-name-baloon {
  color: v-bind('cssConfiguration.colors.chat.myMessage.response.user');
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

.grouped-message:hover>.interact-button:hover {
  stroke: v-bind('cssConfiguration.colors.chat.interactIcons.textHover');
  background-color: v-bind('cssConfiguration.colors.chat.interactIcons.hover');
}

.grouped-message button:first-child {
  margin-right: auto;
  margin-left: 4px;
}

.grouped-message:hover>.interact-button {
  stroke: v-bind('cssConfiguration.colors.chat.interactIcons.text');
  background-color: v-bind('cssConfiguration.colors.chat.interactIcons.main');
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
  background-color: v-bind('cssConfiguration.colors.chat.systemMessage.main');
  color: v-bind('cssConfiguration.colors.chat.systemMessage.text');
  box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, v-bind('cssConfiguration.shadows.messageBalloon'));
}

.timestamp {
  color: v-bind('cssConfiguration.colors.chat.timestamp');
  margin: 8px 0px 8px 0px;
  font-size: 9px !important;
  line-height: 9px;
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
  background: v-bind('cssConfiguration.colors.chat.reaction.main');
  border-radius: 12px;
  border: none;
  cursor: pointer;
  color: v-bind('cssConfiguration.colors.chat.reaction.text');
  stroke: v-bind('cssConfiguration.colors.chat.reaction.text');
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