import React from 'react';
import { openLink } from '@telegram-apps/sdk-react';
// import { useConnectModal } from '@rainbow-me/rainbowkit'; // example
// import { useAccount } from 'wagmi'; // example

// ---- Telegram detection ----
const isTelegram = () => {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).Telegram?.WebApp);
};

const openTokenPocket = () => {
  const tpDeepLink =
    'tpoutside://pull.activity?param=' +
    encodeURIComponent(
      JSON.stringify({
        protocol: 'TokenPocket',
        version: '1.0',
        action: 'login', // wakes TokenPocket and opens dapp browser
      })
    );

  try {
    // Escapes Telegram WebView → Android intent resolver
    openLink(tpDeepLink, { tryBrowser: 'chrome' } as any);
  } catch (err) {
    // Fallback if deep link fails
    window.location.href = 'https://tokenpocket.pro';
  }
};

const ConnectWallet: React.FC = () => {
  const insideTelegram = isTelegram();

  // const { openConnectModal } = useConnectModal(); // if using RainbowKit
  // const { isConnected } = useAccount();

  return (
    <div className="w-full space-y-3">
      {/* Telegram-only TokenPocket button */}
      {insideTelegram && (
        <button
          onClick={openTokenPocket}
          className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95"
        >
          <img
            src="https://www.tokenpocket.pro/favicon.ico"
            className="w-6 h-6 rounded-full"
            alt="TokenPocket"
          />
          Open in TokenPocket
        </button>
      )}

      {/* Normal wallet connect (always available) */}
      <button
        // onClick={openConnectModal}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
      >
        Connect Wallet
      </button>
    </div>
  );
};

export { ConnectWallet };
