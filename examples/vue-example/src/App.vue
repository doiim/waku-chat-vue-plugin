<template>
  <div id="app">
    <h1>Vue Waku Tester</h1>
    <p>This is a simple page test with the ability to change your name and id.</p>

    <div class="input-container">
      <label for="idInput">ID:</label>
      <input type="text" v-model="idInput" id="idInput">
      <button @click="changeId">Change ID</button>
    </div>

    <div class="input-container">
      <label for="nameInput">Name:</label>
      <input type="text" v-model="nameInput" id="nameInput" placeholder="Type your name">
      <button @click="changeName">Change Name</button>
    </div>

    <ChatComponent :externalUserId="externalId" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const idInput = ref('thisIsMyIdDefinedByMyApplication');
const nameInput = ref('');

const externalId = ref('thisIsMyIdDefinedByMyApplication');

const changeId = () => {
  externalId.value = idInput.value
};

const changeName = () => {
  document.dispatchEvent(new CustomEvent('changeNickName', { detail: nameInput.value }));
};
</script>

<style scoped>
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background-color: #f2f2f2;
}

#app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #333;
}

p {
  color: #666;
}

.input-container {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #333;
}

input[type="text"] {
  width: 100%;
  padding: 8px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>