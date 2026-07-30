export default function RollingFirstPlayerScreen({ rollingPlayerName }) {
  return (
    <section className="order-setup rolling-screen">
      <h1>Choosing First Player</h1>
      <p className="order-help">
        The table order is locked. The app is randomly choosing who starts.
      </p>
      <section className="starter-message rolling-name">
        {rollingPlayerName || "Choosing..."}
      </section>
    </section>
  );
}
