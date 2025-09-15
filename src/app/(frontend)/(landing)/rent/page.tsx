"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Mail, Bell, Car, Calendar, Shield, Zap, ArrowRight, CheckCircle } from "lucide-react";

export default function RentComingSoon() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (email) {
      setIsSubscribed(true);
      setEmail("");
      // Here you would typically send the email to your backend
    }
  };

  const features = [
    {
      icon: <Car className="w-6 h-6 text-blue-600" />,
      title: "Easy Vehicle Rentals",
      description: "Browse and rent vehicles from verified owners with just a few clicks"
    },
    {
      icon: <Calendar className="w-6 h-6 text-blue-600" />,
      title: "Flexible Booking",
      description: "Book by hour, day, week, or month with instant confirmation"
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-600" />,
      title: "Secure Transactions",
      description: "Safe payments and comprehensive insurance coverage included"
    },
    {
      icon: <Zap className="w-6 h-6 text-blue-600" />,
      title: "Instant Access",
      description: "Quick approval process and keyless entry for seamless experience"
    }
  ];

  const benefits = [
    "No long-term commitments",
    "24/7 customer support",
    "GPS tracking included",
    "Roadside assistance",
    "Clean & sanitized vehicles",
    "Competitive pricing"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -right-40 -top-40 w-80 h-80 bg-blue-400 rounded-full"></div>
          <div className="absolute -left-20 bottom-10 w-60 h-60 bg-blue-300 rounded-full"></div>
          <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-200 rounded-full opacity-30"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          {/* Coming Soon Badge */}
          <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200 px-4 py-2 text-sm font-medium">
            <Clock className="w-4 h-4 mr-2" />
            Coming Soon
          </Badge>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
            Rent Vehicles <br />
            <span className="text-blue-700">On Demand</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            The future of vehicle rentals is here. Rent cars, bikes, and more from trusted owners 
            in your neighborhood with our peer-to-peer rental platform.
          </p>

          {/* Email Subscription */}
          <Card className="max-w-md mx-auto p-6 mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="text-center mb-4">
              <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-slate-800">Join the Waitlist</h3>
              <p className="text-sm text-slate-600">Be among the first to experience seamless rentals!</p>
            </div>

            {!isSubscribed ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 border-slate-200"
                />
                <Button 
                  onClick={handleSubscribe}
                  className="bg-blue-700 hover:bg-blue-600 text-white px-6"
                  disabled={!email}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Join Waitlist
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-green-700 font-medium">Welcome to the waitlist!</p>
                <p className="text-sm text-slate-600 mt-1">You'll be the first to know when we launch.</p>
              </div>
            )}
          </Card>

          {/* Launch Timeline */}
          <div className="inline-flex items-center bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 border border-slate-200">
            <Clock className="w-5 h-5 text-blue-600 mr-3" />
            <span className="text-slate-700 font-medium">Expected Launch: Q2 2026</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Why Choose Our Rental Platform?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We're building the most convenient and secure way to rent vehicles in Sri Lanka
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300 bg-white border-slate-100">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>

          {/* Benefits Grid */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h3 className="text-2xl font-bold text-slate-800 text-center mb-8">
              What You'll Get
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="py-16 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              How It Will Work
            </h2>
            <p className="text-lg text-slate-600">
              Simple, fast, and secure rental process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Search & Select</h3>
              <p className="text-slate-600">Browse available vehicles in your area and choose the perfect match</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Book & Pay</h3>
              <p className="text-slate-600">Secure your booking with instant confirmation and safe payment</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Drive & Enjoy</h3>
              <p className="text-slate-600">Pick up your vehicle and enjoy your journey with full support</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-700 to-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Revolutionize Your Mobility?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of early adopters waiting for the launch of Sri Lanka's most innovative vehicle rental platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              variant="outline" 
              className="bg-white text-blue-700 border-white hover:bg-blue-50 px-8 py-3"
              onClick={() => window.location.href = '/'}
            >
              Browse Marketplace
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-blue-600 px-8 py-3"
              onClick={() => setIsSubscribed(false)}
            >
              <Mail className="w-4 h-4 mr-2" />
              Get Early Access
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-600 text-sm">
            © 2025 Rathagala. Transforming vehicle rentals across Sri Lanka.
          </p>
        </div>
      </footer>
    </div>
  );
}
