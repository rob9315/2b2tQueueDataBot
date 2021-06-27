//@ts-check
import mineflayer from 'mineflayer';
// const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
import fetch from 'node-fetch';
import { appendFileSync } from 'fs';

let queueData: [number[], number[]] = [[], []];

const formattedTime = ()=>new Date(Date.now()).toLocaleString('en-US');
const timeLog = (...strings: string[])=> console.log(`[${formattedTime()}] ${strings.join(' ')}`)
const timeError = (...errors: (string | Error)[]) => console.error(`[${formattedTime()}] ${errors.join(' ')}`);
const timeWarn = (...warnings: string[]) => console.warn(`[${formattedTime()}] ${warnings.join(' ')}`);

//@ts-ignore
if (!process.env['MC_CREDS']) process.exit(console.error('please provide credentials in format: `email:password`'));

const bot = mineflayer.createBot({
  host: '2b2t.org',
  //@ts-ignore
  username: process.env['MC_CREDS'].match(/.+(?=:)/)[0],
  //@ts-ignore
  password: process.env['MC_CREDS'].match(/(?<=:).+/)[0],
  version: '1.12.2',
});

bot._client.on('packet', (data, meta) => {
  switch (meta.name) {
    case 'playerlist_header':
      try {
        newQueuePos(JSON.parse(data.header).text.split('\n')[5].substring(25));
      } catch {
        console.log('an error occured reading the current queue position.');
      }
      break;
    case 'chat':
      !!JSON.parse(data.message)[0]?.text && newQueuePos(JSON.parse(data.message)[0].text);
      if (JSON.parse(data.message).text === 'Connecting to the server...') uploadQueueData();
      break;
  }
});

function newQueuePos(pos: number | 'None') {
  if (queueData[0][queueData[0].length - 1] === pos) return;
  if (pos === 'None') return timeLog('Joined Queue');
  queueData[0].push(pos);
  queueData[1].push(Date.now() / 1000);
  timeLog(`${pos}`);
}

function uploadQueueData() {
  //@ts-ignore
  fetch('https://hastebin.com/documents', {
    body: JSON.stringify(queueData),
    method: 'POST',
  }).then((res) =>
    res.json().then((json) => {
      timeWarn(`https://hastebin.com/${json.key}`);
      appendFileSync('.queue', `\nhttps://hastebin.com/${json.key}`);
    })
  );
}

const err = (string: string | Error) => {
  timeError(string);
  appendFileSync('.crashqueue', `\n${JSON.stringify(queueData)}`);
  uploadQueueData();
  process.exit();
};

bot._client.on('end', err);
bot._client.on('error', err);
