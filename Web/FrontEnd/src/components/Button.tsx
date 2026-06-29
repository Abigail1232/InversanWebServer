import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  disabled,
  ...props 
}: ButtonProps) => {
  const baseStyles = {
    padding: '12px 24px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.5 : 1,
    lineHeight: '24px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const variants = {
    primary: {
      background: 'linear-gradient(to bottom, #027EB1, #003E7B)',
      color: 'white',
      boxShadow: '0 2px 8px rgba(2, 126, 177, 0.25)'
    },
    secondary: {
      background: 'white',
      color: '#027EB1',
      border: '2px solid #027EB1',
      boxShadow: '0 2px 8px rgba(2, 126, 177, 0.1)'
    },
    ghost: {
      background: 'transparent',
      color: '#027EB1',
      border: 'none'
    }
  };

  return (
    <button
      className={className}
      style={{
        ...baseStyles,
        ...variants[variant]
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};