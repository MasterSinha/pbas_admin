import { I } from './icons';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const Icon = isDark ? I.moon : I.sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '9px 11px',
        borderRadius: 10,
        border: '1px solid var(--c-sidebar-toggle-border)',
        background: 'var(--c-sidebar-toggle-bg)',
        color: 'var(--c-sidebar-text)',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600 }}>
        <Icon size={14} stroke={isDark ? '#c4b5fd' : '#fbbf24'} />
        {isDark ? 'Dark mode' : 'Light mode'}
      </span>
      <span
        aria-hidden="true"
        style={{
          width: 34,
          height: 18,
          borderRadius: 999,
          padding: 2,
          background: isDark ? 'rgba(129,140,248,.3)' : 'rgba(251,191,36,.24)',
          border: `1px solid ${isDark ? 'rgba(129,140,248,.42)' : 'rgba(251,191,36,.42)'}`,
          position: 'relative',
          flexShrink: 0,
          transition: 'background .2s ease,border-color .2s ease',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: isDark ? 2 : 16,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: isDark ? '#c4b5fd' : '#fbbf24',
            boxShadow: '0 2px 8px rgba(0,0,0,.25)',
            transition: 'left .22s cubic-bezier(.34,1.56,.64,1),background .2s ease',
          }}
        />
      </span>
    </button>
  );
}
