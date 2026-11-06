import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface ProfileButtonProps {
  onClick: () => void;
  className?: string;
}

export function ProfileButton({ onClick, className = "" }: ProfileButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`h-8 w-8 sm:h-9 sm:w-auto sm:px-3 border-border hover:bg-accent hover:text-accent-foreground ${className}`}
      aria-label="Open profile settings"
    >
      <User className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="ml-2 hidden sm:inline">Profile</span>
    </Button>
  );
}
