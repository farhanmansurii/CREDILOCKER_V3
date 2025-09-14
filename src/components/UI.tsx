import React from 'react'

export const colors = {
  primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
  primaryDark: getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim(),
  secondary: getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim(),
  accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
  lightAccent: getComputedStyle(document.documentElement).getPropertyValue('--light-accent').trim(),
  veryLight: getComputedStyle(document.documentElement).getPropertyValue('--very-light').trim(),
  purple: getComputedStyle(document.documentElement).getPropertyValue('--purple').trim(),
  blue: getComputedStyle(document.documentElement).getPropertyValue('--blue').trim(),
  success: getComputedStyle(document.documentElement).getPropertyValue('--success').trim(),
  danger: getComputedStyle(document.documentElement).getPropertyValue('--danger').trim(),
  warning: getComputedStyle(document.documentElement).getPropertyValue('--warning').trim(),
  text: getComputedStyle(document.documentElement).getPropertyValue('--text').trim(),
  subtleText: getComputedStyle(document.documentElement).getPropertyValue('--subtle-text').trim(),
  border: getComputedStyle(document.documentElement).getPropertyValue('--border').trim(),
  bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
  white: getComputedStyle(document.documentElement).getPropertyValue('--white').trim(),
  cardBg: getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim()
}

export const Card: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties; className?: string }>> = ({ children, style, className }) => (
  <div
    className={className}
    style={{
      backgroundColor: colors.cardBg,
      border: `1px solid ${colors.border}`,
      borderRadius: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--radius')) || 12,
      boxShadow: '0 4px 16px rgba(94, 98, 169, 0.1)',
      padding: 20,
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      backdropFilter: 'blur(10px)',
      ...style
    }}
  >
    {children}
  </div>
)

type ButtonType = 'button' | 'submit' | 'reset'

export const Button: React.FC<React.PropsWithChildren<{
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  type?: ButtonType;
  className?: string;
}>> = ({ children, variant = 'primary', onClick, disabled, style, type, className }) => {
  const palette: Record<string, { bg: string; color: string; border: string; hoverBg: string; hoverColor: string }> = {
    primary: { bg: colors.primary, color: colors.white, border: colors.primary, hoverBg: colors.primaryDark, hoverColor: colors.white },
    success: { bg: colors.success, color: colors.white, border: colors.success, hoverBg: colors.primaryDark, hoverColor: colors.white },
    danger: { bg: colors.danger, color: colors.white, border: colors.danger, hoverBg: colors.secondary, hoverColor: colors.white },
    secondary: { bg: colors.cardBg, color: colors.text, border: colors.border, hoverBg: colors.lightAccent, hoverColor: colors.text },
    ghost: { bg: 'transparent', color: colors.text, border: 'transparent', hoverBg: colors.veryLight, hoverColor: colors.text }
  }
  const p = palette[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        backgroundColor: p.bg,
        color: p.color,
        border: `1px solid ${p.border}`,
        padding: '10px 16px',
        borderRadius: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--radius')) || 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 14,
        fontWeight: 500,
        transition: 'all 0.2s ease',
        backdropFilter: variant === 'secondary' ? 'blur(10px)' : 'none',
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = p.hoverBg;
          (e.currentTarget as HTMLButtonElement).style.color = p.hoverColor;
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = p.bg;
          (e.currentTarget as HTMLButtonElement).style.color = p.color;
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        }
      }}
    >
      {children}
    </button>
  )
}

export const Toolbar: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    backgroundColor: colors.cardBg,
    borderBottom: `1px solid ${colors.border}`,
    boxShadow: '0 4px 16px rgba(94, 98, 169, 0.1)',
    padding: '0 24px',
    backdropFilter: 'blur(10px)',
    ...style
  }}>
    {children}
  </div>
)

export const Section: React.FC<React.PropsWithChildren<{ title?: string; style?: React.CSSProperties }>> = ({ title, children, style }) => (
  <Card style={{ marginBottom: 16, ...style }}>
    {title && <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 18, color: colors.text, letterSpacing: 0.2 }}>{title}</h3>}
    {children}
  </Card>
)

export const Modal: React.FC<{ open: boolean; onClose: () => void; title?: string; children: React.ReactNode; width?: number; height?: number; noScroll?: boolean }> = ({ open, onClose, title, children, width = 900, height = 600, noScroll = false }) => {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(67, 66, 121, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: colors.cardBg, width, maxWidth: '90vw', height, maxHeight: '85vh', borderRadius: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--radius')) || 12, boxShadow: '0 20px 60px rgba(94, 98, 169, 0.2)', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(10px)' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600, color: colors.text }}>{title}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: colors.text }}>×</button>
        </div>
        <div style={{ padding: 20, overflow: noScroll ? 'hidden' : 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}
