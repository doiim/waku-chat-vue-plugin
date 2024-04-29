
import { bootstrap } from "@libp2p/bootstrap"
import { Type, Field } from "protobufjs"
import {
  createDecoder,
  createEncoder,
  createLightNode,
  waitForRemotePeer,
  Protocols,
  LightNode,
} from "@waku/sdk"

const plugin = {
  install: async (app: any, ChatOptions: any) => {

    loadPlugin = async () => {
      const startWaku = async function (stoppedNode?: LightNode) {
        let node = undefined
        if (stoppedNode) {
          node = stoppedNode
        } else {
          let libp2p = undefined
          if (ChatOptions.wakuPeers && ChatOptions.wakuPeers.length > 0) {
            libp2p = {
              peerDiscovery: [
                bootstrap({ list: ChatOptions.wakuPeers }) as any,
              ],
              hideWebSocketInfo: true
            }
          }

          node = await createLightNode({
            defaultBootstrap: !ChatOptions.wakuPeers || ChatOptions.wakuPeers.length <= 0,
            libp2p,
          });
        }
        await node.start();

        await waitForRemotePeer(node, [Protocols.Store]);
        return node
      }

      const stopWaku = async function (node: LightNode) {
        await node.stop();
        return node
      }

      const chatInterfaces = populateChatInterfaces()

      return { startWaku, stopWaku, chatInterfaces, ChatOptions }
    }
    app.provide('ChatOptions', ChatOptions)

  },
}

const populateChatInterfaces = () => {

  //VERSION 0
  //Initial Version
  const version1 = () => {
    const ParticipantInterface = new Type("Participant")
      .add(new Field("id", 1, "string"))
      .add(new Field("name", 2, "string"))

    const ChatInterface = new Type("ChatInterface")
      .add(new Field("id", 1, "string"))
      .add(new Field("author", 2, "Participant",))
      .add(new Field("type", 3, "string"))
      .add(new Field("timestamp", 4, "uint64"))
      .add(new Field("data", 6, "string"))
      .add(new Field("room", 7, "string"))
    const versionField = new Field("version", 8, "uint64")
    versionField.defaultValue = 0
    ChatInterface
      .add(versionField)

    ChatInterface.add(ParticipantInterface)
    return ChatInterface
  }
  //VERSION 1
  //Moved version to field 2
  //type moved from field 3 to 4
  //timestamp moved from field 4 to 5
  //Added responseTo?:string on 8
  const version2 = () => {
    const ParticipantInterface = new Type("Participant")
      .add(new Field("id", 1, "string"))
      .add(new Field("name", 2, "string"))

    const ChatInterface = new Type("ChatInterface")
      .add(new Field("id", 1, "string"))
    const versionField = new Field("version", 2, "uint64")
    versionField.defaultValue = 1
    ChatInterface
      .add(versionField)
      .add(new Field("author", 3, "Participant",))
      .add(new Field("type", 4, "string"))
      .add(new Field("timestamp", 5, "uint64"))
      .add(new Field("data", 6, "string"))
      .add(new Field("room", 7, "string"))
    const responseToField = new Field("responseTo", 8, "string")
    responseToField.optional = true
    ChatInterface
      .add(responseToField)

    ChatInterface.add(ParticipantInterface)
    return ChatInterface
  }

  return [version1(), version2()]
}

export const upgradeMessage = (messageObj: any) => {
  switch (messageObj.version) {
    case 0:
      messageObj.version++;
      return { ...messageObj, responseTo: undefined }
    default:
      return messageObj
  }
}

export default plugin

export let loadPlugin: () => any = async () => { }

export const changeTopic = async (_channel: string, _topic: string) => {

  const topic = _topic.toLowerCase().replace(/\s/g, '');
  const channel = _channel.toLowerCase().replace(/\s/g, '');

  const contentTopic = `/${channel}/1/${topic}/proto`;
  const encoder = createEncoder({
    contentTopic
  });
  const decoder = createDecoder(contentTopic);

  return { encoder, decoder }
}
