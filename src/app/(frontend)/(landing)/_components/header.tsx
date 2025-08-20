"use client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowRight, CarIcon, Menu, XIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { betterFetch } from "@better-fetch/fetch";

export function Header() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await betterFetch("/api/auth/get-session");
        // Check if data exists, is an object, and has a user property
        if (!error && data && typeof data === 'object' && 'user' in data && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

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

  const closeSheet = () => setIsOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-gradient-to-r from-teal-900 to-teal-800 text-white shadow-md"
          : "bg-gradient-to-r from-teal-900 via-teal-800 to-teal-700 text-white"
      }`}
    >
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2 hover:opacity-90 transition-opacity">
            <CarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white font-heading">
              Rathagala<span className="text-teal-600">.lk</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <Link
              href="/"
              className="hover:text-teal-200 transition-colors font-medium text-sm xl:text-base"
            >
              Home
            </Link>
            <Link
              href="/sell"
              className="hover:text-teal-200 transition-colors font-medium text-sm xl:text-base"
            >
              Sell
            </Link>
            <Link
              href="/about"
              className="hover:text-teal-200 transition-colors font-medium text-sm xl:text-base"
            >
              Want
            </Link>
            <Link
              href="/contact"
              className="hover:text-teal-200 transition-colors font-medium text-sm xl:text-base"
            >
              Rental
            </Link>
            <Link
              href="/profile"
              className="hover:text-teal-200 transition-colors font-medium text-sm xl:text-base"
            >
              Hire
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
            {isLoading ? (
              <div className="w-20 xl:w-24 h-8 xl:h-10 bg-teal-700 rounded animate-pulse"></div>
            ) : user ? (
              <Link href="/profile">
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-white border-white bg-teal-600/20 hover:bg-white hover:text-teal-900 transition-colors duration-200 cursor-pointer flex items-center gap-1 text-xs xl:text-sm"
                >
                  <UserIcon className="h-3 w-3 xl:h-4 xl:w-4" />
                  Account
                </Button>
              </Link>
            ) : (
              <Link href="/signin">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-teal-600/20 hover:text-white transition-colors duration-200 cursor-pointer text-xs xl:text-sm"
                >
                  Login
                </Button>
              </Link>
            )}

            {user && user.role === 'admin' && (
              <Link href="/dashboard">
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-white border-white bg-teal-600/20 hover:bg-white hover:text-teal-900 transition-colors duration-200 cursor-pointer text-xs xl:text-sm"
                >
                  Admin
                </Button>
              </Link>
            )}

            <Link href="/sell/new">
              <Button 
                size="sm"
                className="bg-white text-teal-900 hover:bg-teal-50 hover:shadow-md font-medium transition-all duration-200 cursor-pointer text-xs xl:text-sm"
              >
                Post Ad <ArrowRight className="ml-1 h-3 w-3 xl:h-4 xl:w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white p-2">
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[280px] sm:w-[320px] bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 text-white border-teal-700 p-0 [&>button]:hidden"
              >
                {/* Mobile Sheet Header */}
                <div className="flex items-center justify-between p-4 border-b border-teal-700/50">
                  <div className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <CarIcon className="h-5 w-5" />
                    Rathagala.lk
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeSheet}
                    className="hover:bg-teal-800 text-white p-1.5"
                  >
                    <XIcon className="h-5 w-5" />
                  </Button>
                </div>

                {/* Mobile Navigation */}
                <div className="flex flex-col h-full">
                  <nav className="flex flex-col p-4 space-y-1">
                    <Link
                      href="/"
                      onClick={closeSheet}
                      className="text-base sm:text-lg py-3 px-2 rounded-lg hover:bg-teal-800/50 hover:text-teal-100 transition-all duration-200"
                    >
                      Home
                    </Link>
                    <Link
                      href="/sell"
                      onClick={closeSheet}
                      className="text-base sm:text-lg py-3 px-2 rounded-lg hover:bg-teal-800/50 hover:text-teal-100 transition-all duration-200"
                    >
                      Sell
                    </Link>
                    <Link
                      href="/about"
                      onClick={closeSheet}
                      className="text-base sm:text-lg py-3 px-2 rounded-lg hover:bg-teal-800/50 hover:text-teal-100 transition-all duration-200"
                    >
                      Want
                    </Link>
                    <Link
                      href="/contact"
                      onClick={closeSheet}
                      className="text-base sm:text-lg py-3 px-2 rounded-lg hover:bg-teal-800/50 hover:text-teal-100 transition-all duration-200"
                    >
                      Rental
                    </Link>
                    <Link
                      href="/profile"
                      onClick={closeSheet}
                      className="text-base sm:text-lg py-3 px-2 rounded-lg hover:bg-teal-800/50 hover:text-teal-100 transition-all duration-200"
                    >
                      Hire
                    </Link>
                  </nav>

                  {/* Mobile Auth Section */}
                  <div className="mt-auto p-4 border-t border-teal-700/50 space-y-3">
                    {isLoading ? (
                      <div className="w-full h-10 bg-teal-700/50 rounded animate-pulse"></div>
                    ) : user ? (
                      <div className="space-y-3">
                        <Button
                          asChild
                          variant="outline"
                          className="w-full text-white border-white bg-teal-600/20 hover:bg-white hover:text-teal-900 transition-colors duration-200 cursor-pointer"
                        >
                          <Link href="/profile" onClick={closeSheet}>
                            <UserIcon className="h-4 w-4 mr-2" />
                            My Account
                          </Link>
                        </Button>
                        {user.role === 'admin' && (
                          <Button
                            asChild
                            variant="outline"
                            className="w-full text-white border-white bg-teal-600/20 hover:bg-white hover:text-teal-900 transition-colors duration-200 cursor-pointer"
                          >
                            <Link href="/dashboard" onClick={closeSheet}>
                              Admin Dashboard
                            </Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full text-black border-white hover:bg-white hover:text-teal-900 transition-colors duration-200"
                      >
                        <Link href="/signin" onClick={closeSheet}>
                          Login
                        </Link>
                      </Button>
                    )}
                    
                    <Button
                      asChild
                      className="w-full bg-white text-teal-900 hover:bg-teal-50 font-medium"
                    >
                      <Link href="/sell/new" onClick={closeSheet}>
                        Post Free Ad
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}