"use client";

import { CarIcon, Award, Sparkles, Users, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-700 text-white overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -right-40 -top-40 w-80 h-80 bg-teal-400 rounded-full"></div>
          <div className="absolute -left-20 bottom-10 w-60 h-60 bg-teal-300 rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
              About Rathagala.lk
            </h1>
            <p className="text-xl text-teal-100 mb-6">
              {`Sri Lanka's trusted vehicle marketplace since 2019`}
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-4">
                  Welcome to Rathagala.lk
                </h2>
                <p className="text-slate-600 mb-4">
                  Welcome to Rathagala.lk, Sri Lanka’s trusted online vehicle classified website — the easiest way to buy and sell vehicles across the island.
                </p>
                <p className="text-slate-600 mb-4">
                  {`We created Rathagala.lk with a simple vision: to make vehicle trading faster, safer, and more convenient for everyone. Whether you're a car owner looking to sell, a buyer searching for your next ride, or a dealer promoting your stock — Rathagala.lk is your one-stop platform for all things automotive.`}
                </p>
                <p className="text-slate-600">
                  {`We've designed the platform to make posting an ad take just a few minutes — no complicated forms, no hidden costs. Simply create a free account, upload your details, and your ad will be live for others to see.`}
                </p>
              </div>
              <div className="relative h-80 rounded-lg overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                  {/* Replace with actual company image */}
                  <div className="text-center p-8">
                    <CarIcon className="h-16 w-16 mx-auto mb-4 text-teal-700" />
                    <div className="text-2xl font-bold text-teal-900">
                      Rathagala.lk
                    </div>
                    <p className="text-slate-600 mt-2">
                      186, Depanama, Pannipitiya
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission & What You Can Find */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                Our Mission
              </h2>
              <p className="text-lg text-slate-600">
                Our mission is to connect vehicle buyers and sellers through a reliable online marketplace where every listing is easy to post, easy to find, and easy to trust. We aim to become the most user-friendly classified website in Sri Lanka dedicated exclusively to vehicles.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 text-center">
                What You Can Find
              </h2>
              <div className="text-center mb-6">
                <p className="text-lg text-slate-600">On Rathagala.lk, you can:</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6 border-slate-100 hover:shadow-md transition-shadow text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700 mx-auto">
                    <CarIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Buy & Sell Vehicles
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Cars, vans, jeeps, motorbikes, trucks, and buses
                  </p>
                </Card>

                <Card className="p-6 border-slate-100 hover:shadow-md transition-shadow text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700 mx-auto">
                    <Award className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Parts & Services
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Discover spare parts, accessories, and vehicle services
                  </p>
                </Card>

                <Card className="p-6 border-slate-100 hover:shadow-md transition-shadow text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700 mx-auto">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Rent a Vehicle
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Find rental vehicles for your needs
                  </p>
                </Card>

                <Card className="p-6 border-slate-100 hover:shadow-md transition-shadow text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700 mx-auto">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Hire a Vehicle
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Vehicle hiring services and solutions
                  </p>
                </Card>

                <Card className="p-6 border-slate-100 hover:shadow-md transition-shadow text-center md:col-span-2 lg:col-span-1">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700 mx-auto">
                    <Building className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Business Promotion
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Promote your vehicle business and reach thousands of potential customers
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                Why Choose Rathagala.lk
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6 border-slate-100 hover:shadow-md transition-shadow">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <CarIcon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  Vehicle-focused
                </h3>
                <p className="text-slate-600">
                  100% dedicated to vehicle listings only
                </p>
              </Card>

              <Card className="p-6 border-slate-100 hover:shadow-md transition-shadow">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  User-friendly
                </h3>
                <p className="text-slate-600">
                  Clean, fast, and mobile-friendly interface
                </p>
              </Card>

              <Card className="p-6 border-slate-100 hover:shadow-md transition-shadow">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  Free to use
                </h3>
                <p className="text-slate-600">
                  Sign up and post your ads at no cost
                </p>
              </Card>

              <Card className="p-6 border-slate-100 hover:shadow-md transition-shadow">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  Wider reach
                </h3>
                <p className="text-slate-600">
                  Attract serious buyers from across Sri Lanka
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Our Vision */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Our Vision
            </h2>
            <p className="text-lg text-slate-600">
              {`We're working to become Sri Lanka's leading vehicle marketplace — a trusted name where people confidently trade vehicles of every type, make, and model.`}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-teal-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-xl text-teal-100 mb-8">
              Have a question or suggestion? We'd love to hear from you.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-sm">📧</span>
                </div>
                <p className="text-lg">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:info@rathagala.lk" className="text-teal-200 hover:text-white underline">
                    info@rathagala.lk
                  </a>
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-sm">🏢</span>
                </div>
                <p className="text-lg">
                  <strong>Address:</strong> 186, Depanama, Pannipitiya, Sri Lanka
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              {`Join Sri Lanka's Vehicle Revolution`}
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              {`Whether you're buying or selling, Rathagala.lk is here to make
              your vehicle journey smoother`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sell">
                <Button
                  className="bg-teal-700 hover:bg-teal-600 text-white"
                  size="lg"
                >
                  List Your Vehicle
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-teal-700 text-teal-700 hover:bg-teal-50"
                  size="lg"
                >
                  Browse Vehicles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
