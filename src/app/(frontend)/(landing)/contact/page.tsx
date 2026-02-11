"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  SendIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  subject: z
    .string()
    .min(5, { message: "Subject must be at least 5 characters" }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters" })
});

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMessageSent, setIsMessageSent] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: ""
    }
  });

  // Form submission handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      console.log(values);
      setIsMessageSent(true);
      form.reset();
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div>
      {/* Success Message Popup */}
      <Dialog open={isMessageSent} onOpenChange={setIsMessageSent}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <DialogTitle className="text-center">Message Sent Successfully</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-center">
            <p className="text-slate-600 mb-6">
              Thank you for contacting us! We have received your message and our team will get back to you as soon as possible.
            </p>
          </DialogDescription>
          <div className="flex justify-center">
            <Button
              onClick={() => setIsMessageSent(false)}
              className="bg-teal-700 hover:bg-teal-600 text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
              Contact Us
            </h1>
            <p className="text-xl text-teal-100 mb-6">
              {`We're always happy to hear from you! Whether you have a question, need support, or want to partner with us, the Rathagala.lk team is here to help.`}
            </p>
            <p className="text-lg text-teal-100">
              At Rathagala.lk, we value your feedback and strive to make our platform as easy and reliable as possible for vehicle buyers, sellers, and enthusiasts across Sri Lanka.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information & Form Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Contact Information */}
              <div className="md:col-span-1 space-y-6">
                <Card className="p-6 border-slate-100">
                  <div className="flex gap-4 items-start">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800 mb-1">
                        📧 Email Us
                      </h3>
                      <p className="text-slate-600 text-sm mb-2">
                        For all general inquiries, support requests, or advertising opportunities:
                      </p>
                      <a
                        href="mailto:info@rathagala.lk"
                        className="text-teal-600 hover:text-teal-700 font-medium"
                      >
                        info@rathagala.lk
                      </a>
                      <p className="text-slate-600 text-xs mt-2">
                        Our team aims to respond to all emails within 24–48 hours on working days.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-slate-100">
                  <div className="flex gap-4 items-start">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800 mb-1">
                        🛠️ Technical Support
                      </h3>
                      <p className="text-slate-600 text-sm mb-2">
                        For issues with posting ads, logging in, or browsing:
                      </p>
                      <a
                        href="mailto:support@rathagala.lk"
                        className="text-teal-600 hover:text-teal-700 font-medium"
                      >
                        support@rathagala.lk
                      </a>
                      <p className="text-slate-600 text-xs mt-2">
                        We'll do our best to resolve your issue promptly.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-slate-100">
                  <div className="flex gap-4 items-start">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800 mb-1">
                        🏢 Visit or Write to Us
                      </h3>
                      <p className="text-slate-600 text-sm mb-2">
                        If you'd like to reach us by mail or visit our office:
                      </p>
                      <p className="text-slate-700 text-sm">
                        186, Depanama
                        <br />
                        Pannipitiya
                        <br />
                        Sri Lanka
                      </p>
                      <p className="text-slate-600 text-xs mt-2">
                        Office hours: Monday to Friday, 9:00 AM to 6:00 PM
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-slate-100">
                  <div className="flex gap-4 items-start">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800 mb-1">
                        💬 Feedback and Suggestions
                      </h3>
                      <p className="text-slate-600 text-sm">
                        Your opinion matters to us! If you have ideas for improving Rathagala.lk or have noticed something that could work better, please drop us a message. We appreciate your input and use it to make Rathagala.lk better every day.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Social Media Links */}
                <div className="space-y-3">
                  <h3 className="font-medium text-slate-800">📱 Connect With Us</h3>
                  <p className="text-slate-600 text-sm mb-3">
                    Stay in touch and get the latest updates, offers, and new vehicle listings:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <a
                        href="https://www.facebook.com/rathagala"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors"
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                      <span className="text-sm text-slate-600">Facebook: https://www.facebook.com/rathagala</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href="https://www.instagram.com/rathagala.lk"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                      <span className="text-sm text-slate-600">Instagram: Rathagala.lk</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href="https://www.twitter.com/rathagala"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                      <span className="text-sm text-slate-600">Twitter (X): https://www.twitter.com/rathagala</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <span className="text-xs">▶</span>
                      </div>
                      <span className="text-sm text-slate-500">YouTube: Coming soon</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="md:col-span-2">
                <Card className="p-6 md:p-8 border-slate-100 shadow-md">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                      Send Us a Message
                    </h2>
                    <p className="text-slate-600">
                      {`Fill out the form below and we'll get back to you as soon as possible`}
                    </p>
                  </div>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="your.email@example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="How can we help you?"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Message</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Please provide details about your inquiry..."
                                className="h-40"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-2">
                        <Button
                          type="submit"
                          className="w-full md:w-auto bg-teal-700 hover:bg-teal-600 text-white"
                          disabled={isSubmitting}
                          size="lg"
                        >
                          {isSubmitting ? (
                            <>Sending Message...</>
                          ) : (
                            <>
                              <SendIcon className="mr-2 h-4 w-4" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              Find Us
            </h2>
            <div className="bg-slate-200 h-96 rounded-lg overflow-hidden shadow-md">
              {/* Replace with actual Google Maps embed */}
              <div className="w-full h-full flex items-center justify-center bg-slate-300">
                <MapPin className="h-12 w-12 text-slate-400" />
                <span className="ml-2 text-slate-500 text-lg">
                  Map Placeholder
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-slate-600">
                Quick answers to common questions
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  q: "What are your office hours?",
                  a: "Our office is open Monday to Friday from 9:00 AM to 6:00 PM. We are closed on weekends and public holidays."
                },
                {
                  q: "How quickly do you respond to inquiries?",
                  a: "Our team aims to respond to all emails within 24–48 hours on working days. For technical support issues, we'll do our best to resolve your issue promptly."
                },
                {
                  q: "Where can I find your social media pages?",
                  a: "You can follow us on Facebook (https://www.facebook.com/rathagala), Instagram (Rathagala.lk), and Twitter/X (https://www.twitter.com/rathagala). Our YouTube channel is coming soon!"
                },
                {
                  q: "How can I provide feedback about the website?",
                  a: "Your opinion matters to us! Please send your ideas for improving Rathagala.lk or any suggestions to info@rathagala.lk. We appreciate your input and use it to make our platform better every day."
                },
                {
                  q: "What should I do if I'm having technical issues?",
                  a: "If you experience any issues while posting an ad, logging in, or browsing the site, please email our support team at support@rathagala.lk with details about the problem."
                }
              ].map((faq, index) => (
                <div key={index} className="border-b border-slate-100 pb-5">
                  <h3 className="font-semibold text-lg text-slate-800 mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-slate-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-teal-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-teal-100 mb-6">
              Subscribe to our newsletter for the latest vehicle listings and
              automotive news
            </p>

            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Your email address"
                className="bg-white text-slate-800 border-0 focus-visible:ring-teal-500"
              />
              <Button className="bg-white text-teal-800 hover:bg-teal-100">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
