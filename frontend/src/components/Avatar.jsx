export default function Avatar({ user, size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-3xl'
  };
  const cls = `rounded-full object-cover flex-shrink-0 ${sizes[size]}`;
  if (user?.avatar_url) return <img src={user.avatar_url} alt={user.name} className={cls + ' object-cover'} />;
  return (
    <div className={`${cls} bg-gradient-to-br from-jm-pink to-jm-pinkLight flex items-center justify-center font-bold text-white`}>
      {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}
