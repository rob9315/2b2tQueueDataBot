import { appendFileSync, readFileSync } from 'fs';
import { Client, createClient } from 'minecraft-protocol';

let config: { credentials: { username: string; password: string; accessToken?: string; clientToken?: string }[]; host: string; version: string } = JSON.parse(readFileSync('config.json').toString());

const maxErrors = 5;
const delay = 60000;
const onlyUseAccountsWithAccessToken = true;

let failCount = 0;
let configIndex = Math.floor(Math.random() * config.credentials.length);

if (onlyUseAccountsWithAccessToken) {
  config.credentials = config.credentials.filter(({ accessToken }) => !!accessToken);
}

(async () => {
  while (failCount < maxErrors) {
    console.log(await collectData({ ...config, ...config.credentials[configIndex++ % config.credentials.length] }));
    await new Promise((res) => setTimeout(res, delay));
  }
})();

function collectData(config: { username: string; password: string; host: string }) {
  return new Promise<string>((res) => {
    createClient(config)
      .on('connect', function (this: Client) {
        console.log(`Connecting as ${this.username} (${config.username})`);
      })
      .on('packet', async function (this: Client, data, { name }) {
        if (name === 'teams' && data.players.length > 1) {
          appendFileSync('2b2t.nosql', JSON.stringify({ players: data.players, time: Date.now() }) + '\n');
          this.end('Data collected');
          res('Data collected');
        }
      })
      .on('end', (reason: string) => reason != 'Data collected' && ++failCount && res(`Error #${failCount}/${maxErrors}: ${reason}`))
      .on('error', (reason: string) => reason != 'Data collected' && ++failCount && res(`Error #${failCount}/${maxErrors}: ${reason}`));
  });
}
