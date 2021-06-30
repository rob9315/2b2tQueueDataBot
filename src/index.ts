import { createClient } from 'minecraft-protocol';
import fetch from 'node-fetch';
import { appendFileSync } from 'fs';

// if (!process.env['MC_CREDS']) 
const credError = ()=> process.exit((console.error('please provide credentials in format: `email:password`') as never) ?? 1);


(async () => {
  while (true)
    try {
      console.warn(
        await new Promise<string>((res, rej) => {
          let queueData: [number[], number[]] = [[], []];
          const client = createClient({
            host: '2b2t.org',
            username: (process.env['MC_CREDS'] as string).match(/.+(?=:)/)?.[0] ?? credError(),
            password: (process.env['MC_CREDS'] as string).match(/(?<=:).+/)?.[0] ?? credError(),
            version: '1.12.2',
          });
          client.on('packet', async (data, meta) => {
            switch (meta.name) {
              case 'playerlist_header':
                try {
                  newQueuePos(JSON.parse(data.header).text.split('\n')[5].substring(25));
                } catch {
                  res(`success!\ndata: https://hastebin.com/${await uploadQueueData()}`);
                }
                break;
              case 'chat':
                let pos = (JSON.parse(data.message)[0]?.text as string | undefined)?.match(/^[0-9]+&/)?.[0];
                if (pos) newQueuePos(Number(pos));
                break;
            }
          });
          function newQueuePos(pos: number | 'None') {
            if (queueData[0][queueData[0].length - 1] === pos || pos === 'None') return;
            if (!queueData[0][queueData[0].length - 1]) console.warn('Joined Queue');
            queueData[0].push(pos);
            queueData[1].push(Date.now() / 1000);
          }
          async function uploadQueueData(file = '.queue') {
            let key = (await (await fetch('https://hastebin.com/documents', { body: JSON.stringify(queueData), method: 'POST' })).json()).key as string;
            appendFileSync(file, `\nhttps://hastebin.com/documents/${key}`);
            return key;
          }
          const err = async () => (JSON.stringify(queueData) !== JSON.stringify([[], []]) ? res(`error: https://hastebin.com/${await uploadQueueData('.crashqueue')}`) : rej());
          client.on('end', err);
          client.on('error', err);
        })
      );
    } catch {}
})();
