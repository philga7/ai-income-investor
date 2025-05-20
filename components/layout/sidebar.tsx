"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  BarChart3, 
  Briefcase, 
  Home, 
  LineChart, 
  Menu, 
  PieChart, 
  Settings, 
  Wallet
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  const navigationItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Portfolios",
      href: "/portfolios",
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      title: "Securities",
      href: "/securities",
      icon: <LineChart className="h-5 w-5" />,
    },
    {
      title: "Dividends",
      href: "/dividends",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      title: "Performance",
      href: "/performance",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <aside
      className={cn(
        "group/sidebar h-screen bg-muted/40 transition-all duration-300 ease-in-out",
        expanded ? "w-[240px]" : "w-[70px] hover:w-[240px]"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        {expanded && (
          <Link href="/" className="flex items-center">
            <Wallet className="mr-2 h-6 w-6" />
            <span className="font-semibold">Income Investor</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "h-8 w-8",
            !expanded && "mx-auto"
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>

      <div className="space-y-2 px-3 py-4">
        <TooltipProvider>
          {navigationItems.map((item) => (
            <div key={item.href}>
              {!expanded ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <Button
                        variant={pathname === item.href ? "secondary" : "ghost"}
                        size="icon"
                        className="h-10 w-10"
                      >
                        {item.icon}
                        <span className="sr-only">{item.title}</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link href={item.href}>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="h-10 w-full justify-start"
                  >
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </TooltipProvider>
      </div>
    </aside>
  );
}