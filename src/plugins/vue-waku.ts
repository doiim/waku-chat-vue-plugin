const plugin = {
  install: async (app: any, ChatOptions: any) => {

    loadPlugin = async () => {
      const { bootstrap } = await import("@libp2p/bootstrap")
      const { Type, Field } = await import("protobufjs")
      const {
        createLightNode,
        waitForRemotePeer,
        Protocols,
      } = await import("@waku/sdk")

      const startWaku = async function () {
        let libp2p = undefined
        if (ChatOptions.wakuPeers && ChatOptions.wakuPeers.length > 0) {
          libp2p = {
            peerDiscovery: [
              bootstrap({ list: ChatOptions.wakuPeers }) as any,
            ],
          }
        }

        const node = await createLightNode({
          defaultBootstrap: !ChatOptions.wakuPeers || ChatOptions.wakuPeers.length <= 0,
          libp2p,
        });
        await node.start();

        await waitForRemotePeer(node, [Protocols.Store]);
        return node
      }

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

      return { startWaku, ChatInterface, ChatOptions }
    }
    app.provide('ChatOptions', ChatOptions)

  },

}


export default plugin

export let loadPlugin: () => any = async () => { }

export const changeTopic = async (_channel: string, _topic: string) => {
  const {
    createDecoder,
    createEncoder,
  } = await import("@waku/sdk")
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
