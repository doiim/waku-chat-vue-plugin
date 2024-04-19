
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

      const ParticipantInterface = new Type("Participant")
        .add(new Field("id", 1, "string"))
        .add(new Field("name", 2, "string"))

      const ChatInterface = new Type("ChatInterface")
        .add(new Field("id", 1, "string"))
        .add(new Field("author", 2, "Participant",))
        .add(new Field("type", 3, "string"))
        .add(new Field("timestamp", 4, "uint64"))
        .add(new Field("data", 6, "string"))
        .add(new Field("room", 7, "string"));

      ChatInterface.add(ParticipantInterface)

      return { startWaku, stopWaku, ChatInterface, ChatOptions }
    }
    app.provide('ChatOptions', ChatOptions)

  },
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
