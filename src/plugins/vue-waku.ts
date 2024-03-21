import { Type, Field } from "protobufjs";
import {
  createLightNode,
  waitForRemotePeer,
  createDecoder,
  createEncoder,
  Protocols,
} from "@waku/sdk";
import { bootstrap } from "@libp2p/bootstrap";

const plugin = {
  install: async (app: any, options: any) => {

    const startWaku = async function () {
      let libp2p = undefined
      if (options.wakuPeers.length > 0) {
        libp2p = {
          peerDiscovery: [
            bootstrap({ list: options.wakuPeers }) as any,
          ],
        }
      }

      // Bootstrap node using the static peers
      const node = await createLightNode({
        defaultBootstrap: true,
        libp2p,
      });
      await node.start();

      // Wait for a successful peer connection
      await waitForRemotePeer(node, [Protocols.Store]);
      return node
    }

    app.provide('startWaku', startWaku)

    const ParticipantInterface = new Type("Participant")
      .add(new Field("id", 1, "string"))
      .add(new Field("name", 2, "string"))

    const MsgDataInterface = new Type("MsgData")
      .add(new Field("text", 1, "string"))
      .add(new Field("emoji", 2, "string"))

    // Create a message structure using Protobuf
    const ChatInterface = new Type("ChatInterface")
      .add(new Field("id", 1, "string"))
      .add(new Field("author", 2, "Participant",))
      .add(new Field("type", 3, "string"))
      .add(new Field("timestamp", 4, "uint64"))
      .add(new Field("liked", 5, "string"))
      .add(new Field("data", 6, "MsgData"))
      .add(new Field("room", 7, "string"));

    ChatInterface.add(ParticipantInterface)
    ChatInterface.add(MsgDataInterface)

    app.provide('chatInterface', ChatInterface)
    app.provide('chatOptions', options)
  },

}


export default plugin

export const changeTopic = (_channel: string, _topic: string) => {
  const topic = _topic.toLowerCase().replace(/\s/g, '');
  const channel = _channel.toLowerCase().replace(/\s/g, '');

  // Choose a content topic
  const contentTopic = `/${channel}/1/${topic}/proto`;
  // Create a message encoder and decoder
  const encoder = createEncoder({
    contentTopic
  });
  const decoder = createDecoder(contentTopic);

  return { encoder, decoder }
}
