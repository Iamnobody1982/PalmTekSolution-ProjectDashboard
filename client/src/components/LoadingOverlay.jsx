export default function LoadingOverlay({ message }) {
  return (
    <div className="lov">
      <div className="spin" />
      <div className="lov-txt">{message || 'Loading...'}</div>
    </div>
  );
}
