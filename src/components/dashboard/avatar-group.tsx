import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type AvatarGroupProps = {
  users: {
    src: string;
    fallback: string;
  }[];
  limit?: number;
};

export function AvatarGroup({ users, limit = 5 }: AvatarGroupProps) {
  const visibleUsers = users.slice(0, limit);
  const remainingCount = users.length - limit;

  return (
    <div className="flex -space-x-4">
      {visibleUsers.map((user, index) => (
        <Avatar key={index} className="h-8 w-8 border-2 border-card">
          <AvatarImage src={user.src} alt="Avatar" />
          <AvatarFallback>{user.fallback}</AvatarFallback>
        </Avatar>
      ))}
      {remainingCount > 0 && (
        <Avatar className="h-8 w-8 border-2 border-card">
          <AvatarFallback>+{remainingCount}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
