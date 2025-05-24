import handle from "../../handle.js";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendToFriend = async (privatekey) => {
  try {
    await delay(10000);
    const { wallet, account } = await handle(privatekey);
    if (!wallet || !account) {
      return "RPC Error: Unable to connect to the wallet or address.";
    }
    try {
      const tx = {
        from: account.address,
        to: "0xC7a4C764f43375561426A4C6f38852Db9D34F9b7",
        value: BigInt(wallet.utils.toWei("0.005", "ether")),
        gas:
          Math.floor(
            Number(
              await wallet.eth.estimateGas({
                from: account.address,
                to: "0xC7a4C764f43375561426A4C6f38852Db9D34F9b7",
                value: BigInt(wallet.utils.toWei("0.005", "ether")),
                nonce: await wallet.eth.getTransactionCount(
                  account.address,
                  "pending"
                ),
              })
            )
          ) * 3,
        gasPrice: Number(await wallet.eth.getGasPrice()) * 2,
        nonce: await wallet.eth.getTransactionCount(account.address, "pending"),
      };

      const signedTx = await wallet.eth.accounts.signTransaction(
        tx,
        privatekey
      );
      try {
        const receipt = await wallet.eth.sendSignedTransaction(
          signedTx.rawTransaction
        );
        if (receipt.status) {
          return {
            message: `Send Success \nResult: \nTransaction Hash: https://testnet.pharosscan.xyz/tx/${receipt.transactionHash}`,
            status: true,
            txHash: receipt.transactionHash,
          };
        } else {
          return {
            message: `Send Failed \nResult: \nTransaction Hash: https://testnet.pharosscan.xyz/tx/${receipt.transactionHash}`,
            status: false,
          };
        }
      } catch (error) {
        return {
          message: `Send Error: ${error.message}`,
          status: false,
        };
      }
    } catch (error) {
      return {
        message: `Send Error: ${error.message}`,
        status: false,
      };
    }
  } catch (error) {
    return {
      message: `Error: ${error.message}`,
      status: false,
    };
  }
};

export default sendToFriend;
