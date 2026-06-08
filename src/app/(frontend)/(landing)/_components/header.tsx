"use client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { betterFetch } from "@better-fetch/fetch";
import { ArrowRight, Calendar, CarIcon, Check, LayoutDashboard, LogOut, Menu, Search, TrendingUp, UserIcon, Wrench, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

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
            const userRes = await betterFetch<any>("/api/users/me");
            if (userRes.data && userRes.data.organizationId) {
              userData = { ...userData, organizationId: userRes.data.organizationId };
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
              <div className="w-20 h-9 bg-teal-800/40 rounded animate-pulse"></div>
            ) : user ? (
              <div className="group relative">
                <Link href="/profile">
                  <Button
                    variant="outline"
                    className="text-white border-white/30 bg-transparent hover:bg-white hover:text-[#024950] h-9 px-3 text-sm font-medium transition-colors"
                  >
                    <UserIcon className="h-4 w-4 mr-1" />
                    Account
                  </Button>
                </Link>
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-sm shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-sm font-medium"
                    >
                      <UserIcon className="h-4 w-4 text-slate-500" />
                      View Account
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 text-sm font-medium text-left"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
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

            {user && (user.role === 'admin' || user.organizationId) && (
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="text-white border-white/30 bg-transparent hover:bg-white hover:text-[#024950] h-9 px-3 text-sm font-medium transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Dashboard
                </Button>
              </Link>
            )}

            <Link href={user ? "/sell/new" : "/signin?redirect=/sell/new"}>
              <Button
                className="bg-teal-500 hover:bg-teal-400 text-white border-0 h-9 px-4 text-sm font-bold shadow-sm transition-colors cursor-pointer"
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
                      className="w-full justify-center bg-white hover:text-white border-1 hover:border-white text-teal-900 hover:bg-teal-900 rounded-sm shadow-sm py-5 font-bold"
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
