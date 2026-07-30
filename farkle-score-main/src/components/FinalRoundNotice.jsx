export default function FinalRoundNotice({ finalRoundStarter, getPlayerName }) {
  return (
    <section className="winner">
      Final round started by{" "}
      {finalRoundStarter ? getPlayerName(finalRoundStarter, 0) : "a player"}.
      Each other player gets one more turn.
    </section>
  );
}
