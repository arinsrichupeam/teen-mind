import { ClientConfig, Client } from "@line/bot-sdk";

declare let global: { lineSdk: Client };
let lineSdk: Client;

const clientConfig: ClientConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN as string,
  channelSecret: process.env.LINE_CHANNEL_SECRET as string,
};

if (process.env.NODE_ENV === "production") {
  lineSdk = new Client(clientConfig);
} else {
  if (!global.lineSdk) {
    global.lineSdk = new Client(clientConfig);
  }
  lineSdk = global.lineSdk;
}
export default lineSdk;
