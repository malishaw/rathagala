"use client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { betterFetch } from "@better-fetch/fetch";
import { ArrowRight, Calendar, CarIcon, Check, LayoutDashboard, LogOut, Menu, Search, TrendingUp, UserIcon, XIcon } from "lucide-react";
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
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
        ? "bg-gradient-to-r from-teal-900 to-teal-800 text-white shadow-md"
        : "bg-gradient-to-r from-teal-900 via-teal-800 to-teal-700 text-white"
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link
            href="/"
            className="flex items-center space-x-2 hover:opacity-90 transition-opacity"
            onClick={(e) => {
              // If already on home page, force refresh
              if (window.location.pathname === '/') {
                e.preventDefault();
                window.location.reload();
              }
            }}
          >
            <CarIcon className="h-6 w-6" />
            <div className="text-xl md:text-2xl font-bold text-white font-heading">
              Rathagala<span className="text-teal-600">.lk</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="hover:text-teal-200 transition-colors font-medium"
              onClick={(e) => {
                // If already on home page, force refresh
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  window.location.reload();
                }
              }}
            >
              Home
            </Link>
            <Link
              href="/search?listingType=SELL"
              className="hover:text-teal-200 transition-colors font-medium"
            >
              Buy
            </Link>
            <Link
              href="/search?listingType=WANT"
              className="hover:text-teal-200 transition-colors font-medium"
            >
              Want
            </Link>
            <Link
              href="/search?listingType=RENT"
              className="hover:text-teal-200 transition-colors font-medium"
            >
              Rent
            </Link>
            <Link
              href="/search?listingType=HIRE"
              className="hover:text-teal-200 transition-colors font-medium"
            >
              Hire
            </Link>
            <Link
              href="/compare"
              className="hover:text-teal-200 transition-colors font-medium"
            >
              Compare
            </Link>
            <Link
              href="/analyse"
              className="hover:text-teal-200 transition-colors font-medium"
            >
              Analyse
            </Link>
            {/* <Link
              href="/search"
              className="hover:text-teal-200 transition-colors font-medium"
            >
              Search
            </Link> */}
            {/* <Link
              href="/about"
              className="hover:text-teal-200 transition-colors font-medium"
            >
              About
            </Link> */}
            {/* <Link
              href="/contact"
              className="hover:text-teal-200 transition-colors font-medium"
            >
              Contact
            </Link> */}
            {/* <Link
              href="/profile"
              className="hover:text-teal-200 transition-colors font-medium"
            >
              Profile
            </Link> */}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="w-24 h-10 bg-teal-700 rounded animate-pulse"></div>
            ) : user ? (
              <div className="group relative">
                <Link href="/profile">
                  <Button
                    variant="outline"
                    className="text-white border-white bg-teal-600/20 hover:bg-white hover:text-teal-900 transition-all duration-200 cursor-pointer flex items-center gap-1"
                  >
                    <UserIcon className="h-4 w-4" />
                    Account
                  </Button>
                </Link>
                {/* Dropdown appears on hover */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out transform group-hover:translate-y-0 -translate-y-2 z-50">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50 transition-colors cursor-pointer"
                    >
                      <UserIcon className="h-4 w-4 text-teal-700" />
                      <span className="text-sm font-medium text-gray-700">View Account</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">Sign out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/signin">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-teal-600/20 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  Login
                </Button>
              </Link>
            )}

            {user && (user.role === 'admin' || user.organizationId) && (
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="text-white border-white bg-teal-600/20 hover:bg-white hover:text-teal-900 transition-colors duration-200 cursor-pointer flex items-center gap-1"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {user.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                </Button>
              </Link>
            )}

            <Link href={user ? "/sell/new" : "/signup"}>
              <Button
                className="bg-white text-teal-900 hover:bg-teal-50 hover:shadow-md font-medium transition-all duration-200 cursor-pointer"
              >
                Post Free Ad <ArrowRight className="ml-1 h-4 w-4" />
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
                className="w-[85%] sm:w-[360px] bg-gradient-to-r from-teal-900 to-teal-800 text-white border-teal-900 px-6 py-8 rounded-l-3xl"
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
                    <div className="bg-white/10 p-1.5 rounded-lg">
                      <LayoutDashboard className="h-4 w-4" />
                    </div>
                    Home
                  </Link>
                  <Link
                    href="/search?listingType=SELL"
                    className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="bg-white/10 p-1.5 rounded-lg">
                      <CarIcon className="h-4 w-4" />
                    </div>
                    Buy
                  </Link>

                  <Link
                    href="/search?listingType=WANT"
                    className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="bg-white/10 p-1.5 rounded-lg">
                      <Search className="h-4 w-4" />
                    </div>
                    Want
                  </Link>

                  <Link
                    href="/search?listingType=RENT"
                    className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="bg-white/10 p-1.5 rounded-lg">
                      <Calendar className="h-4 w-4" />
                    </div>
                    Rent
                  </Link>

                  <Link
                    href="/search?listingType=HIRE"
                    className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="bg-white/10 p-1.5 rounded-lg">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    Hire
                  </Link>

                  <Link
                    href="/compare"
                    className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="bg-white/10 p-1.5 rounded-lg">
                      <Check className="h-4 w-4" />
                    </div>
                    Compare
                  </Link>

                  <Link
                    href="/analyse"
                    className="text-base font-semibold flex items-center gap-3 py-2 border-b border-white/5 hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="bg-white/10 p-1.5 rounded-lg">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    Analyse
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
                      <div className="bg-red-500/10 p-1.5 rounded-lg">
                        <LogOut className="h-4 w-4" />
                      </div>
                      Logout
                    </button>
                  )}
                  <div className="pt-4 mt-2 border-t border-white/10 space-y-3">
                    {isLoading ? (
                      <div className="w-full h-10 bg-teal-700/60 rounded-lg animate-pulse" />
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
                        className="w-full justify-center text-teal-900 border-white/60 hover:bg-white hover:text-teal-900 transition-colors duration-200 rounded-xl py-5"
                      >
                        <Link href="/signin">Login</Link>
                      </Button>
                    )}

                    <Button
                      asChild
                      className="w-full justify-center bg-white text-teal-900 hover:bg-teal-50 rounded-xl shadow-sm py-5 font-bold"
                    >
                      <Link href={user ? "/sell/new" : "/signup"}>Post Free Ad</Link>
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
