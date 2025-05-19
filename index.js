import chalk from "chalk";
import figlet from "figlet";
import fs from "fs/promises";
import { swapPharostousdc, swapUsdcToPharos } from "./src/Swap/Swap.js";
import addLp from "./src/AddLP/addLp.js";
import login from "./src/Login/login.js";
import autocheckin from "./src/Login/Autocheckin.js";
import {
  verifyTaskSOCIAL,
  verifyTaskOnchain,
} from "./src/Login/autoVerifyTask.js";
import sendToFriend from "./src/SendToFriend/send.js";
import { generatedWallet } from "./Createwallet.js";
import { config } from "./config.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const displayBanner = () => {
  console.log(
    chalk.cyan(
      figlet.textSync("Makmum Airdrop", {
        font: "Slant",
        horizontalLayout: "default",
        verticalLayout: "default",
        width: 80,
        whitespaceBreak: true,
      })
    )
  );
  const hakari = chalk.bgBlue("Created by https://t.me/hakaringetroll");
  console.log(hakari);
  console.log("Join To get Info airdrop : https://t.me/makmum");
};

(async () => {
  displayBanner();
  const wallet = (await fs.readFile("wallet.txt", "utf-8"))
    .replace(/\r/g, "")
    .split("\n")
    .filter(Boolean);
  if (wallet.length === 0) {
    console.log(chalk.red("No wallets found. Generating new wallets..."));
    const result = await generatedWallet();
    console.log(chalk.green(result));
    console.log(chalk.green("Wallets generated successfully."));
    console.log(chalk.green("Please run the script again."));
    return;
  }
  console.log(chalk.green("Wallets loaded successfully."));

  while (true) {
    for (let cycle = 0; cycle < config.maxTX; cycle++) {
      for (let i = 0; i < wallet.length; i++) {
        try {
          const privatekey = wallet[i];
          const { message, jwt, address } = await login(privatekey);
          const getDataSwap = await swapPharostousdc(privatekey, jwt);
          const getDataSwap2 = await swapUsdcToPharos(privatekey);
          const getDataAddLp = await addLp(privatekey);
          const getDataSendToFriend = await sendToFriend(privatekey);

          if (!message && !jwt) {
            console.log(chalk.red("Login failed, skipping..."));
            break;
          }
          console.log(
            chalk.yellow(message),
            chalk.blue(`\n${await autocheckin(jwt, address)}`),
            chalk.green(
              `\nResult Swap Pharos: ${getDataSwap.message} \nResult swap usdc: ${getDataSwap2.message} \nResul addlp :${getDataAddLp.message} \nResult send friend: ${getDataSendToFriend.message}`
            ),
            chalk.yellowBright(`\n${await verifyTaskSOCIAL(jwt, address)}`),
            chalk.yellowBright(
              `\n${await verifyTaskOnchain(
                jwt,
                address,
                getDataSwap.txHash,
                getDataAddLp.txHash,
                getDataSendToFriend.txHash
              )}`
            ) // soon i will update because only txhash send to friend working
          );
          await delay(5000); // Delay for 1 second
        } catch (error) {
          console.error(chalk.red("Error in iteration:", error));
          console.log(chalk.red("Skipping to next wallet..."));
          continue;
        }
      }
      console.log("Waiting for 24 hours before the next iteration...");
      await delay(4 * 60 * 60 * 1000); // Delay for 1 hours
    }
  }
})();
