import { Box } from "lucide-react";
import { ModeToggle } from "./ui/mode-toggle";

export const Navbar = () => {
  return (
    <nav className="flex justify-between items-center mx-12 my-7">
      <div className="flex items-center gap-2">
        <Box className="size-8" />
          <span className="tracking-tighter text-3xl font-extrabold text-primary flex gap-2 items-center">
            Eclips
          </span>
      </div>
      <ModeToggle />
    </nav>
  );
};