"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Mail, Bell, Search, Heart, Target, Users, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

export default function WantComingSoon() {
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
      icon: <Search className="w-6 h-6 text-purple-600" />,
      title: "Smart Vehicle Search",
      description: "Post your requirements and let our AI find the perfect vehicles for you"
    },
    {
      icon: <Heart className="w-6 h-6 text-purple-600" />,
      title: "Wishlist & Alerts",
      description: "Save your dream vehicles and get instant notifications when they're available"
    },
    {
      icon: <Target className="w-6 h-6 text-purple-600" />,
      title: "Custom Matching",
      description: "Advanced filters and preferences to match exactly what you're looking for"
    },
    {
      icon: <Users className="w-6 h-6 text-purple-600" />,
      title: "Community Requests",
      description: "Connect with sellers who have what you want through our request board"
    }
  ];

  const benefits = [
    "Get notified when your dream vehicle is listed",
    "Post specific requirements for sellers to see",
    "Save time with automated search alerts",
    "Connect directly with potential sellers",
    "Price tracking and market insights",
    "Expert advice and recommendations"
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Describe What You Want",
      description: "Tell us your budget, preferred make/model, and specific requirements"
    },
    {
      step: 2,
      title: "We Find Matches",
      description: "Our system searches and notifies you of vehicles that match your criteria"
    },
    {
      step: 3,
      title: "Connect & Purchase",
      description: "Connect with sellers and make your purchase with confidence"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -right-40 -top-40 w-80 h-80 bg-purple-400 rounded-full"></div>
          <div className="absolute -left-20 bottom-10 w-60 h-60 bg-purple-300 rounded-full"></div>
          <div className="absolute top-1/4 right-1/4 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-200 rounded-full opacity-40"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          {/* Coming Soon Badge */}
          <Badge className="mb-6 bg-purple-100 text-purple-800 border-purple-200 px-4 py-2 text-sm font-medium">
            <Clock className="w-4 h-4 mr-2" />
            Coming Soon
          </Badge>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
            Find Exactly <br />
            <span className="text-purple-700">What You Want</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Can't find your dream vehicle? Let us help! Post what you're looking for and we'll 
            connect you with sellers who have exactly what you want.
          </p>

          {/* Email Subscription */}
          <Card className="max-w-md mx-auto p-6 mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="text-center mb-4">
              <Mail className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-slate-800">Get Early Access</h3>
              <p className="text-sm text-slate-600">Be the first to find your perfect vehicle!</p>
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
                  className="bg-purple-700 hover:bg-purple-600 text-white px-6"
                  disabled={!email}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Get Access
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-green-700 font-medium">You're on the list!</p>
                <p className="text-sm text-slate-600 mt-1">We'll notify you when it's ready.</p>
              </div>
            )}
          </Card>

          {/* Launch Timeline */}
          <div className="inline-flex items-center bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 border border-slate-200">
            <Clock className="w-5 h-5 text-purple-600 mr-3" />
            <span className="text-slate-700 font-medium">Expected Launch: Q3 2026</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Smart Vehicle Discovery
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Revolutionary features designed to help you find exactly what you're looking for
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300 bg-white border-slate-100">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
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

          {/* Benefits Section */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h3 className="text-2xl font-bold text-slate-800 text-center mb-8">
              Why You'll Love It
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

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-r from-slate-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600">
              Simple steps to find your perfect vehicle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Solution */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center mb-4">
                  <AlertCircle className="w-6 h-6 text-orange-500 mr-3" />
                  <h3 className="text-2xl font-bold text-slate-800">The Problem</h3>
                </div>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Endless scrolling through listings that don't match your needs
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Missing out on perfect vehicles because you didn't see them in time
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    No way to tell sellers exactly what you're looking for
                  </li>
                </ul>
              </div>
              
              <div>
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                  <h3 className="text-2xl font-bold text-slate-800">Our Solution</h3>
                </div>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    AI-powered matching that finds vehicles based on your exact criteria
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Instant notifications when your perfect vehicle becomes available
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Direct connection with sellers through want requests
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-700 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Never Miss Your Dream Vehicle Again
          </h2>
          <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of smart buyers who are waiting for the most intelligent way to find vehicles in Sri Lanka.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              variant="outline" 
              className="bg-white text-purple-700 border-white hover:bg-purple-50 px-8 py-3"
              onClick={() => window.location.href = '/'}
            >
              Browse Current Listings
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-purple-600 px-8 py-3"
              onClick={() => setIsSubscribed(false)}
            >
              <Heart className="w-4 h-4 mr-2" />
              Join Wishlist
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-600 text-sm">
            © 2025 Rathagala. Making vehicle discovery intelligent and effortless.
          </p>
        </div>
      </footer>
    </div>
  );
}
