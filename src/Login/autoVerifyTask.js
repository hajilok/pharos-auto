import axios from "axios";

const infoTask = () => {
  return { TaskIDSOCIAL: [201, 202, 203, 204], taskIDOnchain: [103] };
};

const autoVerifyTask = async (url, jwt) => {
  let response;
  let attempts = 0;

  while (true) {
    try {
      response = await axios.post(url, null, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          Referer: "https://testnet.pharosnetwork.xyz/",
        },
      });

      if (response.status === 200) {
        return response.data.msg;
      }

      console.log(`ℹ️ Attempt ${attempts + 1}: status ${response.status}`);
    } catch (err) {
      if (err.response && err.response.status === 504) {
        console.log(
          `⚠️ 400 Bad Request - Retrying (attempt ${attempts + 1})...`
        );
      } else {
        console.error(`❌ Error:`, err.message);
        break;
      }
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay 1 detik sebelum ulang
  }
};

export const verifyTaskSOCIAL = async (jwt, address) => {
  try {
    const { TaskIDSOCIAL } = infoTask();
    for (const id of TaskIDSOCIAL) {
      const result = await autoVerifyTask(
        `https://api.pharosnetwork.xyz/task/verify?address=${address}&task_id=${id}`,
        jwt
      );
      return `Task Social : ${result}`;
    }
  } catch (error) {
    console.error("Error verifying task:", error);
  }
};

export const verifyTaskOnchain = async (
  jwt,
  address,
  txHashSwap,
  txHashAddLp,
  txHashSendToFriend
) => {
  try {
    const { taskIDOnchain } = infoTask();
    for (const id of taskIDOnchain) {
      console.log(`Verifying Task ID: ${id}`);
      const result = await autoVerifyTask(
        `https://api.pharosnetwork.xyz/task/verify?address=${address}&task_id=${id}&tx_hash=${txHashSendToFriend}`,
        jwt
      );
      // for (const txHash of [txHashSwap, txHashAddLp, txHashSendToFriend]) {    // }
      return `Task Onchain: ${result}`;
    }
  } catch (error) {
    return `Error verifying task: ${error.message}`;
  }
};
