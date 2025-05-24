import axios from "axios";
import handle from "../../handle.js";

const login = async (privatekey) => {
  const { wallet, address } = await handle(privatekey);
  if (!wallet || !address) {
    return "RPC Error: Unable to connect to the wallet or address.";
  }
  try {
    const login = await axios.post(
      `https://api.pharosnetwork.xyz/user/login?address=${address}&signature=${
        wallet.eth.accounts.sign(
          `pharos`,
          privatekey.startsWith("0x") ? privatekey : "0x" + privatekey
        ).signature
      }&invite_code=IuYwB8kUuMVatpRc`,
      {
        address,
        signature: wallet.eth.accounts.sign(
          `pharos`,
          privatekey.startsWith("0x") ? privatekey : "0x" + privatekey
        ).signature,
        invite_code: "IuYwB8kUuMVatpRc",
      },
      {
        headers: {
          Authorization: `Bearer null`,
          Referer: "https://testnet.pharosnetwork.xyz/",
        },
      }
    );
    if (login.status === 200) {
      try {
        const getPoints = await axios.get(
          `https://api.pharosnetwork.xyz/user/profile?address=${address}`,
          {
            headers: {
              Authorization: `Bearer ${login.data.data.jwt}`,
              Referer: "https://testnet.pharosnetwork.xyz/",
            },
          }
        );
        if (getPoints.status === 200) {
          return {
            message: `Login Success \nResult: \nTestnet Point: ${getPoints.data.data.user_info.TotalPoints} \nwallet: ${address}`,
            jwt: login.data.data.jwt,
            address,
          };
        } else {
          console.log("Failed to fetch points:", getPoints.data);
          return;
        }
      } catch (error) {
        console.error("Error fetching points:", error);
        return `Points Error: ${error.message}`;
      }
    } else {
      console.log("Login failed:", login.data);
      return;
    }
  } catch (error) {
    console.error("Error fetching login:", error);
    return `Login Error: ${error.message}`;
  }
};
export default login;
