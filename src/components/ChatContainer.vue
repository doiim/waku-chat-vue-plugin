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
            <div class="message" @click="scrollToMessage(groupedMsgs[0].responseTo, messageContainerRef)">
              <div v-for="(message, idMsg) in groupedResponse(groupedMsgs[0].responseTo).slice(0, 4)" :key="idMsg"
                class="message-content">{{
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
            <button v-if="!messageReacted(groupedMsgs[0].id) && groupedMsgs[0].author.id === getMyID()"
              @click="reactMessage(idGroup, 'like')">
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
                <div v-for="(msgReact, idxReact) in getMessageReactions(groupedMsgs[0].id)" class="message-react"
                  :key="idxReact">
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
            <TransitionGroup name="fade">
              <button v-if="!messageReacted(groupedMsgs[0].id) && groupedMsgs[0].author.id !== getMyID()"
                @click="reactMessage(idGroup, 'like')">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M 15.364 8.138 L 14.758 8.042 L 15.364 8.138 Z M 14.786 11.174 L 14.179 11.079 L 14.786 11.174 Z M 3.847 14.308 L 3.234 14.357 L 3.847 14.308 Z M 3.18 7.318 L 3.793 7.271 L 3.18 7.318 Z M 9.637 2.955 L 10.244 3.046 L 9.637 2.955 Z M 9.093 5.965 L 9.7 6.055 L 9.093 5.965 Z M 3.65 6.271 L 3.248 5.849 L 3.65 6.271 Z M 4.83 5.349 L 5.232 5.772 L 4.83 5.349 Z M 6.784 2.63 L 6.188 2.489 L 6.784 2.63 Z M 7.175 1.265 L 7.77 1.405 L 7.175 1.265 Z M 8.548 0.606 L 8.359 1.137 L 8.548 0.606 Z M 8.667 0.641 L 8.855 0.109 L 8.667 0.641 Z M 6.246 3.879 L 6.788 4.142 L 6.246 3.879 Z M 9.563 1.487 L 8.967 1.627 L 9.563 1.487 Z M 7.733 0.656 L 7.466 0.154 L 7.733 0.656 Z M 1.413 15.048 L 0.799 15.096 L 1.413 15.048 Z M 0.615 6.686 L 1.228 6.638 C 1.2 6.34 0.918 6.116 0.589 6.128 C 0.259 6.141 0 6.387 0 6.686 L 0.615 6.686 Z M 14.758 8.042 L 14.179 11.079 L 15.392 11.269 L 15.971 8.233 L 14.758 8.042 Z M 9.022 14.884 L 5.207 14.884 L 5.207 16 L 9.022 16 L 9.022 14.884 Z M 4.46 14.26 L 3.793 7.271 L 2.567 7.367 L 3.234 14.357 L 4.46 14.26 Z M 14.179 11.079 C 13.763 13.26 11.595 14.884 9.022 14.884 L 9.022 16 C 12.161 16 14.869 14.014 15.392 11.269 L 14.179 11.079 Z M 9.03 2.865 L 8.486 5.875 L 9.7 6.055 L 10.244 3.046 L 9.03 2.865 Z M 4.052 6.695 L 5.232 5.772 L 4.428 4.926 L 3.248 5.849 L 4.052 6.695 Z M 7.38 2.77 L 7.77 1.405 L 6.579 1.125 L 6.188 2.489 L 7.38 2.77 Z M 8.359 1.137 L 8.478 1.172 L 8.855 0.109 L 8.736 0.074 L 8.359 1.137 Z M 6.788 4.142 C 7.044 3.707 7.244 3.247 7.38 2.77 L 6.188 2.489 C 6.077 2.881 5.913 3.259 5.703 3.616 L 6.788 4.142 Z M 8.478 1.172 C 8.73 1.245 8.908 1.421 8.967 1.627 L 10.159 1.346 C 9.99 0.757 9.493 0.295 8.855 0.109 L 8.478 1.172 Z M 7.77 1.405 C 7.799 1.304 7.879 1.212 8 1.159 L 7.466 0.154 C 7.029 0.344 6.701 0.696 6.579 1.125 L 7.77 1.405 Z M 8 1.159 C 8.11 1.111 8.24 1.103 8.359 1.137 L 8.736 0.074 C 8.318 -0.047 7.861 -0.019 7.466 0.154 L 8 1.159 Z M 9.767 7.244 L 14.019 7.244 L 14.019 6.128 L 9.767 6.128 L 9.767 7.244 Z M 2.026 15 L 1.228 6.638 L 0.002 6.734 L 0.799 15.096 L 2.026 15 Z M 1.231 15.079 L 1.231 6.686 L 0 6.686 L 0 15.079 L 1.231 15.079 Z M 0.799 15.096 C 0.789 14.983 0.887 14.884 1.015 14.884 L 1.015 16 C 1.611 16 2.077 15.537 2.026 15 L 0.799 15.096 Z M 10.244 3.046 C 10.347 2.48 10.317 1.901 10.159 1.346 L 8.967 1.627 C 9.083 2.031 9.104 2.453 9.03 2.865 L 10.244 3.046 Z M 5.207 14.884 C 4.818 14.884 4.493 14.614 4.46 14.26 L 3.234 14.357 C 3.321 15.286 4.179 16 5.207 16 L 5.207 14.884 Z M 5.232 5.772 C 5.79 5.336 6.391 4.817 6.788 4.142 L 5.703 3.616 C 5.419 4.099 4.966 4.506 4.428 4.926 L 5.232 5.772 Z M 15.971 8.233 C 16.18 7.134 15.248 6.128 14.019 6.128 L 14.019 7.244 C 14.483 7.244 14.837 7.625 14.758 8.042 L 15.971 8.233 Z M 1.015 14.884 C 1.135 14.884 1.231 14.972 1.231 15.079 L 0 15.079 C 0 15.587 0.454 16 1.015 16 L 1.015 14.884 Z M 8.486 5.875 C 8.356 6.592 8.966 7.244 9.767 7.244 L 9.767 6.128 C 9.726 6.128 9.694 6.094 9.7 6.055 L 8.486 5.875 Z M 3.793 7.271 C 3.772 7.052 3.869 6.838 4.052 6.695 L 3.248 5.849 C 2.765 6.226 2.512 6.791 2.567 7.367 L 3.793 7.271 Z">
                  </path>
                </svg>
              </button>
              <button v-if="groupedMsgs[0].author.id !== getMyID()" @click="setResponse(idGroup)">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M 14.877 1.132 C 14.877 6.404 13.841 8.878 11.608 10.035 C 9.374 11.191 5.944 11.029 1.155 11.029 M 1.155 11.029 C 1.869 10.395 2.584 9.76 3.299 9.126 C 4.014 8.491 4.728 7.857 5.443 7.222 M 1.155 11.029 C 1.869 11.664 2.584 12.298 3.299 12.933 C 4.014 13.567 4.728 14.202 5.443 14.836"
                    stroke-linecap="round" stroke-linejoin="round"
                    style="stroke-width: 2px; transform-origin: 8.016px 7.984px;">
                  </path>
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
</template>

<style scoped lang="css">
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
  padding: 16px 30px 24px 30px;
}

.response-input {
  background-color: v-bind('cssConfiguration.colors.input.response.main');
  color: v-bind('cssConfiguration.colors.input.response.text');
  width: 100%;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
}

.response-input>div {
  padding: 8px;
  width: 85%;
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
  padding: 0px 12px;
  line-height: 16px;
  border-radius: 8px;
  background-color: v-bind('cssConfiguration.colors.input.main');
}

.message-input input {
  width: 100%;
  outline: none;
  border: none;
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

.own-message .grouped-response .message {
  margin-left: auto;
  background-color: v-bind('cssConfiguration.colors.chat.myMessage.response.main');
  color: v-bind('cssConfiguration.colors.chat.myMessage.response.text');
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

.grouped-response .message {
  background-color: v-bind('cssConfiguration.colors.chat.otherMessage.response.main');
  color: v-bind('cssConfiguration.colors.chat.otherMessage.response.text');
  padding: 8px;
  cursor: pointer;
}

.grouped-message {
  display: flex;
  width: 100%;
}

.response-disabled .message {
  color: v-bind('cssConfiguration.colors.chat.disabledResponse.text') !important;
  background-color: v-bind('cssConfiguration.colors.chat.disabledResponse.main') !important;
  font-style: italic;
  cursor: default;
}

.grouped-message button {
  align-self: center;
  margin-right: 4px;
  margin-left: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
}

.grouped-message button:first-child {
  margin-right: auto;
}

.grouped-message:hover>button svg {
  stroke: v-bind('cssConfiguration.colors.chat.interactIcons');
}

.own-message .grouped-message button {
  align-self: center;
  margin-right: 4px;
  margin-left: 4px;
  transform: scaleX(1);
}

.own-message .grouped-message button:first-child {
  margin-left: auto;
}

.message {
  position: relative;
  line-height: 16px;
  min-width: 96px;
  max-width: 67%;
  padding: 12px;
  border-radius: 8px;
  background-color: v-bind('cssConfiguration.colors.chat.otherMessage.main');
  color: v-bind('cssConfiguration.colors.chat.otherMessage.text');
  box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, v-bind('cssConfiguration.shadows.messageBalloon'));
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
  bottom: -8px;
  right: 8px;
}

.message-react button {
  background: v-bind('cssConfiguration.colors.chat.reaction.main');
  border-radius: 12px;
  color: v-bind('cssConfiguration.colors.chat.reaction.text');
  stroke: v-bind('cssConfiguration.colors.chat.reaction.text');
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