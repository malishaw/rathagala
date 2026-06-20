"use client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { betterFetch } from "@better-fetch/fetch";
import { ArrowRight, Calendar, CarIcon, Check, LayoutDashboard, LogOut, Menu, Search, TrendingUp, UserIcon, Wrench, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const { data: session, isPending: isLoading } = authClient.useSession();
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user) {
        let userData: any = { ...session.user };

        // If organizationId is not in session, fetch it from user endpoint
        // session.user usually has role and other added fields
        if (!userData.organizationId) {
          try {
            const res = await fetch("/api/users/me");
            if (res.ok) {
              const data = await res.json();
              if (data && data.organizationId) {
                userData = { ...userData, organizationId: data.organizationId };
              }
            }
          } catch (error) {
            console.error("Failed to fetch user organization:", error);
          }
        }

        setUser(userData);
      } else {
        setUser(null);
      }
    };

    fetchUserData();
  }, [session]);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      // You can adjust this threshold value as needed
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Initial check in case page is loaded at a scrolled position
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
            router.refresh();
          }
        }
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 border-b border-teal-800 bg-[#024950] text-white shadow-sm`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <Link
            href="/"
            className="flex items-center space-x-2 font-bold text-white"
            onClick={(e) => {
              // If already on home page, force refresh
              if (window.location.pathname === '/') {
                e.preventDefault();
                window.location.reload();
              }
            }}
          >
            <CarIcon className="h-6 w-6 text-white" />
            <div className="text-xl md:text-2xl font-bold tracking-tight font-heading">
              Rathagala.lk
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-5 lg:space-x-6">
            {[
              { href: "/", label: "Home", forceRefresh: true },
              { href: "/search?listingType=SELL", label: "Buy" },
              { href: "/search?listingType=WANT", label: "Want" },
              { href: "/search?listingType=RENT", label: "Rent" },
              { href: "/search?listingType=HIRE", label: "Hire" },
              { href: "/auto-parts", label: "Auto Parts" },
              { href: "/compare", label: "Compare" },
              { href: "/analyse", label: "Analyze" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="py-1 text-sm font-medium text-teal-100 hover:text-white transition-colors duration-150"
                onClick={(e) => {
                  if (link.forceRefresh && window.location.pathname === '/') {
                    e.preventDefault();
                    window.location.reload();
                  }
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoading ? (
              <div className="w-9 h-9 bg-teal-800/40 rounded-full animate-pulse"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center focus:outline-none cursor-pointer group transition-transform duration-200 active:scale-95">
                    <Avatar className="h-9 w-9 border-2 border-teal-400/50 hover:border-teal-300 transition-colors">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback className="bg-teal-700 text-white font-bold text-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1.5 bg-white border border-slate-100 shadow-xl rounded-xl p-1.5 z-[100] text-slate-800">
                  <DropdownMenuLabel className="px-2.5 py-2 font-normal">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">{user.name}</p>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem asChild className="focus:bg-teal-50 focus:text-teal-700 hover:bg-teal-50 cursor-pointer rounded-lg px-2.5 py-2 text-sm font-medium">
                    <Link href="/profile" className="flex w-full items-center gap-2.5">
                      <UserIcon className="h-4 w-4 text-slate-500" />
                      View Account
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' || user.organizationId ? (
                    <DropdownMenuItem asChild className="focus:bg-teal-50 focus:text-teal-700 hover:bg-teal-50 cursor-pointer rounded-lg px-2.5 py-2 text-sm font-medium">
                      <Link href="/dashboard" className="flex w-full items-center gap-2.5">
                        <LayoutDashboard className="h-4 w-4 text-slate-500" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem onClick={handleSignOut} className="focus:bg-red-50 focus:text-red-700 hover:bg-red-50 text-red-600 hover:text-red-700 cursor-pointer rounded-lg px-2.5 py-2 text-sm font-medium">
                    <div className="flex w-full items-center gap-2.5">
                      <LogOut className="h-4 w-4 text-red-500" />
                      Sign out
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/signin">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10 h-9 px-3 text-sm font-medium transition-colors"
                >
                  Login
                </Button>
              </Link>
            )}

            <Link href={user ? "/sell/new" : "/signin?redirect=/sell/new"}>
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 h-9 px-4 text-sm font-bold shadow-[0_4px_12px_rgba(249,115,22,0.25)] hover:shadow-[0_4px_16px_rgba(249,115,22,0.35)] transition-all duration-300 rounded-lg hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
              >
                Post Free Ad
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                hideCloseButton
                className="w-[85%] sm:w-[360px] bg-gradient-to-r from-teal-900 to-teal-800 text-white border-teal-900 px-6 py-8 rounded-none"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex items-center justify-between mb-10">
                  <div className="text-xl font-bold text-white flex items-center gap-2 tracking-wide">
                    <CarIcon className="h-5 w-5" />
                    Rathagala.lk
                  </div>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-teal-800"
                    >
                      <XIcon className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>
                <nav className="flex flex-col gap-0.5">
                  <Link
                    href="/"
                    className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 hover:text-teal-200 transition-colors"
                    onClick={(e) => {
                      setIsOpen(false);
                      // If already on home page, force refresh
                      if (window.location.pathname === '/') {
                        e.preventDefault();
                        window.location.reload();
                      }
                    }}
                  >
                    <div className="bg-white/10 p-1.5 rounded-sm">
                      <LayoutDashboard className="h-4 w-4" />
                    </div>
                    Home
                  </Link>
                  <Link
                    href="/search?listingType=SELL"
                    className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="bg-white/10 p-1.5 rounded-sm">
                      <CarIcon className="h-4 w-4" />
                    </div>
                    Buy
                  </Link>

                  <Link
                    href="/search?listingType=WANT"
                    className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="bg-white/10 p-1.5 rounded-sm">
                      <Search className="h-4 w-4" />
                    </div>
                    Want
                  </Link>

                  <Link
                    href="/search?listingType=RENT"
                    className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="bg-white/10 p-1.5 rounded-sm">
                      <Calendar className="h-4 w-4" />
                    </div>
                    Rent
                  </Link>

                  <Link
                    href="/search?listingType=HIRE"
                    className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="bg-white/10 p-1.5 rounded-sm">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    Hire
                  </Link>

                  <Link
                    href="/auto-parts"
                    className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="bg-white/10 p-1.5 rounded-sm">
                      <Wrench className="h-4 w-4" />
                    </div>
                    Auto Parts
                  </Link>

                  <Link
                    href="/compare"
                    className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="bg-white/10 p-1.5 rounded-sm">
                      <Check className="h-4 w-4" />
                    </div>
                    Compare
                  </Link>

                  <Link
                    href="/analyse"
                    className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="bg-white/10 p-1.5 rounded-sm">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    Analyze
                  </Link>

                  {user && (
                    <button
                      type="button"
                      className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 text-red-400 hover:text-red-300 transition-colors text-left"
                      onClick={() => {
                        setIsOpen(false);
                        void handleSignOut();
                      }}
                    >
                      <div className="bg-red-500/10 p-1.5 rounded-sm">
                        <LogOut className="h-4 w-4" />
                      </div>
                      Logout
                    </button>
                  )}
                  <div className="pt-4 mt-2 border-t border-white/10 space-y-3">
                    {isLoading ? (
                      <div className="w-full h-10 bg-teal-700/60 rounded-sm animate-pulse" />
                    ) : user ? (
                      <>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full text-white border-white bg-teal-600/20 hover:bg-white hover:text-teal-900 transition-colors duration-200 cursor-pointer flex items-center gap-1 py-5"
                        >
                          <Link href="/profile">
                            <UserIcon className="h-4 w-4" />
                            Account
                          </Link>
                        </Button>
                        {((user as any).role === 'admin' || (user as any).organizationId) && (
                          <Button
                            asChild
                            variant="outline"
                            className="w-full text-white border-white bg-teal-600/20 hover:bg-white hover:text-teal-900 transition-colors duration-200 cursor-pointer flex items-center gap-1 py-5"
                          >
                            <Link href="/dashboard">
                              <LayoutDashboard className="h-4 w-4" />
                              {user.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                            </Link>
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full justify-center text-teal-900 border-white/60 hover:bg-white hover:text-teal-900 transition-colors duration-200 rounded-sm py-5"
                      >
                        <Link href="/signin">Login</Link>
                      </Button>
                    )}

                    <Button
                      asChild
                      className="w-full justify-center bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white hover:text-white border-0 shadow-[0_4px_12px_rgba(249,115,22,0.25)] py-5 font-bold rounded-lg transition-all duration-200"
                    >
                      <Link href={user ? "/sell/new" : "/signin?redirect=/sell/new"}>Post Free Ad</Link>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
