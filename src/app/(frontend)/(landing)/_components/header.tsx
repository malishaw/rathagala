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

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-gradient-to-r from-teal-900 to-teal-800 text-white shadow-md"
          : "bg-gradient-to-r from-teal-900 via-teal-800 to-teal-700 text-white"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
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
            >
              Home
            </Link>
            <Link
              href="/search?listingType=SELL"
              className="hover:text-teal-200 transition-colors font-medium"
            >
              Sell
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
              <Link href="/profile">
                <Button 
                  variant="outline"
                  className="text-white border-white bg-teal-600/20 hover:bg-white hover:text-teal-900 transition-colors duration-200 cursor-pointer flex items-center gap-1"
                >
                  <UserIcon className="h-4 w-4" />
                  Account
                </Button>
              </Link>
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

            {user && user.role === 'admin' && (
              <Link href="/dashboard">
              <Button 
                variant="outline"
                className="text-white border-white bg-teal-600/20 hover:bg-white hover:text-teal-900 transition-colors duration-200 cursor-pointer flex items-center gap-1"
              >
                Admin Dashboard
              </Button>
              </Link>
            )}

            <Link href="/sell/new">
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
                className="w-[85%] sm:w-[350px] bg-gradient-to-r from-teal-900 to-teal-800 text-white border-teal-900"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="text-xl font-bold text-white flex items-center gap-2">
                    <CarIcon className="h-5 w-5" />
                    Rathagala.lk
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-teal-800"
                  >
                    <XIcon className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex flex-col space-y-5">
                  <Link
                    href="/"
                    className="text-lg hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href="/search?listingType=SELL"
                    className="text-lg hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Sell
                  </Link>
                  <Link
                    href="/search?listingType=WANT"
                    className="text-lg hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Want
                  </Link>
                  <Link
                    href="/search?listingType=RENT"
                    className="text-lg hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Rent
                  </Link>
                  <Link
                    href="/search?listingType=HIRE"
                    className="text-lg hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Hire
                  </Link>
                  <Link
                    href="/search"
                    className="text-lg hover:text-teal-200 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Search
                  </Link>
                  <div className="pt-5 space-y-3">
                    {isLoading ? (
                      <div className="w-full h-10 bg-teal-700 rounded animate-pulse"></div>
                    ) : user ? (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full text-white border-white bg-teal-600/20 hover:bg-white hover:text-teal-900 transition-colors duration-200 cursor-pointer flex items-center gap-1"
                      >
                        <Link href="/profile">
                          <UserIcon className="h-4 w-4" />
                          Account
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full text-white border-white hover:bg-white hover:text-teal-900"
                      >
                        <Link href="/signin">Login</Link>
                      </Button>
                    )}
                    
                    <Button
                      asChild
                      className="w-full bg-white text-teal-900 hover:bg-teal-50"
                    >
                      <Link href="/sell/new">Post Free Ad</Link>
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
