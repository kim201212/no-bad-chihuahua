import { mnemonicToSeedSync } from 'bip39';
import { fromSeed } from 'bip32';
import { createRawTx, getAccount, PATH, sendTx, signTx } from './services/cosmos';
import { MNEMONIC } from './config';
import { getReward } from './services/api';
import { BN } from 'bn.js';
import express, { Request, Response, NextFunction } from 'express';

const app = express();

const seed = mnemonicToSeedSync(MNEMONIC);
const node = fromSeed(seed);

const child = node.derivePath(`m/44'/${PATH}'/0'/0/0`);
const account = getAccount(child, 'chihuahua');

app.post('/aggregate', async (req: Request, res: Response, next: NextFunction) => {
  const rewardResponse = await getReward(account.address);
  const validatorAddress = rewardResponse.result.rewards[0].validator_address;
  const amount = new BN(rewardResponse.result.rewards[0].reward[0].amount.split('.')[0], 10);
  const gasPrice = new BN(200000, 10);

  const rawTx = await createRawTx(account.address, validatorAddress, amount.sub(gasPrice).toString());
  const signedTx = await signTx(child, 'chihuahua', rawTx);
  const result = await sendTx(signedTx);

  res.send(result);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`
    ################################################
            Server listening on port: ${port}
    ################################################
  `);
});
