"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Mail, Bell, Car, Users, MapPin, Star, ArrowRight } from "lucide-react";

export default function HireComingSoon() {
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
      icon: <Car className="w-6 h-6 text-teal-600" />,
      title: "Vehicle Rentals",
      description: "Wide range of vehicles available for short and long-term rentals"
    },
    {
      icon: <Users className="w-6 h-6 text-teal-600" />,
      title: "Driver Services",
      description: "Professional drivers for your transportation needs"
    },
    {
      icon: <MapPin className="w-6 h-6 text-teal-600" />,
      title: "Island-wide Coverage",
      description: "Services available across all major cities in Sri Lanka"
    },
    {
      icon: <Star className="w-6 h-6 text-teal-600" />,
      title: "Premium Experience",
      description: "Quality assured vehicles and verified service providers"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -right-40 -top-40 w-80 h-80 bg-teal-400 rounded-full"></div>
          <div className="absolute -left-20 bottom-10 w-60 h-60 bg-teal-300 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-200 rounded-full opacity-20"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          {/* Coming Soon Badge */}
          <Badge className="mb-6 bg-teal-100 text-teal-800 border-teal-200 px-4 py-2 text-sm font-medium">
            <Clock className="w-4 h-4 mr-2" />
            Coming Soon
          </Badge>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
            Vehicle Hire & <br />
            <span className="text-teal-700">Driver Services</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Get ready for the most convenient way to hire vehicles and drivers across Sri Lanka. 
            We're working hard to bring you an amazing experience.
          </p>

          {/* Email Subscription */}
          <Card className="max-w-md mx-auto p-6 mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="text-center mb-4">
              <Mail className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-slate-800">Get Notified</h3>
              <p className="text-sm text-slate-600">Be the first to know when we launch!</p>
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
                  className="bg-teal-700 hover:bg-teal-600 text-white px-6"
                  disabled={!email}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notify Me
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-green-700 font-medium">Thank you for subscribing!</p>
                <p className="text-sm text-slate-600 mt-1">We'll notify you when we launch.</p>
              </div>
            )}
          </Card>

          {/* Launch Timeline */}
          <div className="inline-flex items-center bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 border border-slate-200">
            <Clock className="w-5 h-5 text-teal-600 mr-3" />
            <span className="text-slate-700 font-medium">Expected Launch: Q1 2026</span>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              What's Coming
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Discover the amazing features we're building to revolutionize vehicle hiring in Sri Lanka
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300 bg-white border-slate-100">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-teal-700 to-teal-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Travel?
          </h2>
          <p className="text-teal-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of others waiting for the launch of Sri Lanka's most advanced vehicle hiring platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              variant="outline" 
              className="bg-white text-teal-700 border-white hover:bg-teal-50 px-8 py-3"
              onClick={() => window.location.href = '/'}
            >
              Explore Marketplace
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-teal-600 px-8 py-3"
              onClick={() => setIsSubscribed(false)}
            >
              <Mail className="w-4 h-4 mr-2" />
              Join Waitlist
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-600 text-sm">
            © 2025 Rathagala. Building the future of vehicle services in Sri Lanka.
          </p>
        </div>
      </footer>
    </div>
  );
}
