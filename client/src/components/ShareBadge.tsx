import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface Props {
  liveCode: string | null;
}

/** "Watch along" badge on the game screen: tap for QR + join code. */
export default function ShareBadge({ liveCode }: Props) {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  const url = liveCode ? `${location.origin}/#watch=${liveCode}` : null;

  useEffect(() => {
    if (url && open) {
      QRCode.toDataURL(url, { margin: 1, width: 220 })
        .then(setQr)
        .catch(() => setQr(null));
    }
  }, [url, open]);

  if (!liveCode) return null;

  return (
    <>
      <button
        type="button"
        className="share-badge"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        📺 Live · {liveCode}
      </button>
      {open && (
        <div className="share-panel">
          <p>Watch along on any phone on the network:</p>
          {qr && <img src={qr} alt={`QR code to watch game ${liveCode}`} />}
          <p className="share-url">{url}</p>
          <p className="hint">
            Or open the app, tap 📺 Watch a Game, and enter <strong>{liveCode}</strong>.
          </p>
        </div>
      )}
    </>
  );
}
