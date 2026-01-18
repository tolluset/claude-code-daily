interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function IconButton({ 
  variant = 'default', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  const variantClasses = {
    default: 'text-muted-foreground hover:text-foreground hover:bg-muted',
    destructive: 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
    ghost: 'text-muted-foreground hover:bg-muted-foreground/10'
  };

  return (
    <button
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-lg transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
