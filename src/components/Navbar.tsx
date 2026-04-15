import { Box } from "lucide-react";
import { ModeToggle } from "./ui/mode-toggle";

export const Navbar = () => {
  return (
    <nav className="flex justify-between px-4 items-center py-4">
      <div className="flex items-center gap-2">
        <Box className="size-8" />
        <div className="flex flex-col gap-4">
          <span className="tracking-tighter text-3xl font-extrabold text-primary flex gap-2 items-center">
            Eclips
          </span>
        </div>
      </div>
      <ModeToggle />
    </nav>
  );
};