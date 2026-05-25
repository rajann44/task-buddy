interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: { class: 'avatar-sm', fontSize: '12px' },
  md: { class: 'avatar-md', fontSize: '14px' },
  lg: { class: 'avatar-lg', fontSize: '20px' },
  xl: { class: 'avatar-xl', fontSize: '28px' },
};

const dimensions = { sm: 32, md: 40, lg: 56, xl: 80 };

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function Avatar({ name, avatarUrl, size = 'md', className = '' }: AvatarProps) {
  const sz = sizeMap[size];
  const dim = dimensions[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`avatar ${sz.class} ${className}`}
        width={dim}
        height={dim}
      />
    );
  }

  return (
    <div
      className={`avatar-initials ${sz.class} ${className}`}
      style={{ fontSize: sz.fontSize, width: dim, height: dim }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
