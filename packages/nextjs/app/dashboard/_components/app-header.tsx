import Image from "next/image";
import Link from "next/link";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

// Define the props type for AppHeader
interface NavItem {
  href: string;
  label: string;
  isActive: boolean;
}

interface AppHeaderProps {
  navItems: NavItem[];
  onNavClick: (href: string) => void;
}

export function AppHeader({ navItems, onNavClick }: AppHeaderProps) {
  return (
    <header className="bg-[#11181C] px-3 sm:px-6 pt-4 pb-2">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and Navigation */}
        <div className="flex items-center space-x-5 sm:space-x-10">
          <Link href="/">
            <Image src="/spacebums.png" alt="Logo" width={100} height={100} className="w-16 sm:w-28" />
          </Link>

          <nav className="flex items-center space-x-4 sm:space-x-6">
            {navItems.map((item, index) => (
              <Link
                href={item.href}
                key={index}
                onClick={() => onNavClick(item.href)}
                className={`hover:text-gray-300 transition-colors font-extralight flex justify-center items-center h-full rounded-3xl text-sm sm:text-sm ${
                  item.isActive ? "text-white sm:bg-[#070907] sm:px-5 sm:py-2" : "text-gray-400"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side - User section */}
        <div className="flex items-center space-x-4">
          <div className="navbar-end grow">
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
