export default function Modal({ children, maxWidth = 480, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
        animation: 'fadeIn .18s ease both',
      }}
      onClick={onClose}
    >
      <div
        className="modal-enter"
        style={{
          background: 'var(--c-surf)', borderRadius: 16, padding: 28,
          width: '100%', maxWidth,
          border: '1px solid var(--c-border)',
          boxShadow: '0 32px 80px var(--c-stat-shadow), 0 0 0 1px rgba(255,255,255,.04)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
