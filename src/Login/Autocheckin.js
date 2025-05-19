import axios from "axios";

const autocheckin = async (jwt, address) => {
  try {
    const checkin = await axios.post(
      `https://api.pharosnetwork.xyz/sign/in?address=${address}`,
      { address },
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          Referer: "https://testnet.pharosnetwork.xyz/",
        },
      }
    );
    if (checkin.data.msg !== "ok") {
      return `Autocheckin error : ${checkin.data.msg}`;
    } else {
      return `Autocheckin success : ${checkin.data.msg}`;
    }
  } catch (error) {
    return `Checkin kok Error: ${error.message}`;
  }
};

export default autocheckin;
