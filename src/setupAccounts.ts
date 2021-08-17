//@ts-ignore
import { default as yggdrasil } from 'yggdrasil';
import { readFileSync, writeFileSync } from 'fs';
import { v4 } from 'uuid';

const ygg = yggdrasil();
const maxErrors = 2;

const config: { clientToken?: string; credentials: { username: string; password: string; accessToken?: string; clientToken?: string }[] } = JSON.parse(readFileSync('config.json').toString());

if (!config.clientToken) config.clientToken = v4();

(async () => {
  for (const index in config.credentials) {
    const credCount = config.credentials.length.toString();
    function n() {
      return `[#${(+index + 1).toString().padStart(credCount.length)}/${credCount} (${username})]`;
    }
    let { username, password, accessToken, clientToken } = config.credentials[index];
    if (accessToken)
      try {
        await ygg.validate(accessToken);
        console.log(`${n()} Existing accessToken validated`);
        continue;
      } catch (e) {
        console.log(`${n()} Tried to validate exisiting accessToken, got error: ${e}`);
        accessToken = undefined;
        await new Promise((res) => setTimeout(res, 15000));
      }
    let errorCount = 0;
    while (true)
      try {
        ({ accessToken, clientToken } = await ygg.auth({
          token: clientToken ?? config.clientToken,
          user: username,
          pass: password,
        }));
        break;
      } catch (e) {
        if ((e as Error).message == 'Invalid credentials. Invalid username or password.') {
          console.error(`${n()} invalid credentials, moving on`);
          errorCount = maxErrors;
          break;
        }
        errorCount++;
        console.log(`${n()} Encountered ERROR (#${errorCount}/${maxErrors}), waiting 2 minutes then trying again`);
        console.error(`Error: ${(e as Error).message}`);
        if (errorCount == maxErrors) {
          console.error(`${n()} too many retries. moving on`);
          break;
        }
        await new Promise((res) => setTimeout(res, 120000));
      }
    if (errorCount != maxErrors) {
      console.log(`${n()} got accessToken`);
      config.credentials[index] = clientToken && clientToken != config.clientToken ? { username, password, accessToken, clientToken } : { username, password, accessToken };
    }
    await new Promise((res) => setTimeout(res, 15000));
  }
  writeFileSync('config.json', JSON.stringify(config, null, 2));
  console.log('Wrote to config.json file. Will quit now.');
})();
