import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import JSBI from "jsbi";
import abi from "./abi.json"

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: process.env.INFURA_KEY // required
    }
  }
};

const web3Modal = new Web3Modal({
  network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions // required
});

export var web3;
export var provider;

export const checkNetwork = async (provider) => {
  if (provider) {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }]
      })
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  } else {
    console.error("Can't setup the network on metamask because window.ethereum is undefined")
    return false
  }
}

export const connectWallet = async () => {
  provider = await web3Modal.connect();
  web3 = new Web3(provider);

  if (provider.chainId !== 1) {
    await checkNetwork(provider)
  }

  provider.on("disconnect", async (code, reason) => {
    web3Modal.clearCachedProvider();
    provider = null;
    web3 = null;
  });
}

const contractAddress = "0xEae1d1c686005a5A8510683c34D6BB2455988282";
const cost = "50000000000000000";

export async function getAccounts() {
  if (!provider) return;
  try {
    const accounts = await web3?.eth.getAccounts()
    const selectedAccount = accounts[0];

    return selectedAccount;
  } catch (e) {
    console.log(e);
    return [];
  }
}

// const provider = await web3Modal.connect();
export const mint = async (totalToMint) => {
  const contract = new web3.eth.Contract(abi, contractAddress)
  const transactionParameters = {
    to: contractAddress,
    from: (await getAccounts()),
    value: JSBI.multiply(
      JSBI.BigInt(cost),
      JSBI.BigInt(totalToMint.toString())
    ).toString(16),
    data: contract.methods.mintFatmen(totalToMint).encodeABI(),
  };

  try {
    await provider?.request({
      method: "eth_sendTransaction",
      params: [transactionParameters],
    });
    return true
  } catch (error) {
    console.log(error);
  }
}

export const getMinted = async (ref = null) => {
  provider = await web3Modal.connect();
  web3 = new Web3(provider);

  const contract = new web3.eth.Contract(abi, contractAddress);

  await contract.methods.totalSupply().call().then((result) => {
    ref.current.innerHTML = result;
  });

  setInterval(async () => {
    const result = await contract.methods.totalSupply().call()
    ref.current.innerHTML = result;
  }, 3000);
}