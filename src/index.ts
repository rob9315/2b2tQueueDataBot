import { appendFileSync, readFileSync } from 'fs';
import { Client, createClient } from 'minecraft-protocol';

const config = JSON.parse(readFileSync('config.json').toString());

let failCount = 0;
(async () => {
  while (failCount < 5) {
    console.log(
      await new Promise((res) => {
        createClient(config)
          .on('packet', async function (this: Client, data, { name }) {
            if (name === 'teams' && !data.players.includes(this.username)) {
              appendFileSync('2b2t.nosql', JSON.stringify({ players: data.players, time: Date.now() }) + '\n');
              this.end('Data collected');
              res('Data collected');
            }
          })
          .on('end', (reason: string) => reason != 'Data collected' && ++failCount && res(`Error #${failCount}: ${reason}`))
          .on('error', (reason: string) => reason != 'Data collected' && ++failCount && res(`Error #${failCount}: ${reason}`));
      })
    );
    await new Promise((res) => setTimeout(res, 60000));
  }
})();
