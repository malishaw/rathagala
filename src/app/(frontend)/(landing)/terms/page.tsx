"use client";

import { CarIcon, Scale, FileText, AlertTriangle, Shield, Gavel, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function TermsPage() {
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
              Terms and Conditions
            </h1>
            {/* <p className="text-xl text-teal-100 mb-6">
              Last updated: October 11, 2025
            </p> */}
            <p className="text-lg text-teal-100">
              Please read these terms and conditions carefully before using Our Service.
            </p>
          </div>
        </div>
      </section>

      {/* Introduction & Definitions */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <FileText className="h-8 w-8 text-teal-700" />
                Interpretation and Definitions
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">Interpretation</h3>
                  <p className="text-slate-600">
                    The words whose initial letters are capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Definitions</h3>
                  <p className="text-slate-600 mb-4">For the purposes of these Terms and Conditions:</p>
                  
                  <div className="grid gap-4">
                    {[
                      { term: "Country", definition: "refers to: Sri Lanka" },
                      { term: "Company", definition: "(referred to as either \"the Company\", \"We\", \"Us\" or \"Our\" in this Agreement) refers to Rathagala.lk." },
                      { term: "Device", definition: "means any device that can access the Service such as a computer, a cell phone or a digital tablet." },
                      { term: "Service", definition: "refers to the Website." },
                      { term: "Terms and Conditions", definition: "(also referred as \"Terms\") mean these Terms and Conditions that form the entire agreement between You and the Company regarding the use of the Service." },
                      { term: "Third-party Social Media Service", definition: "means any services or content (including data, information, products or services) provided by a third-party that may be displayed, included or made available by the Service." },
                      { term: "Website", definition: "refers to Rathagala.lk, accessible from https://rathagala.lk" },
                      { term: "You", definition: "means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable." }
                    ].map((item, index) => (
                      <div key={index} className="border-l-4 border-teal-200 pl-4 py-2">
                        <strong className="text-slate-800">{item.term}:</strong> <span className="text-slate-600">{item.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Acknowledgment */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Scale className="h-8 w-8 text-teal-700" />
                Acknowledgment
              </h2>

              <div className="space-y-4 text-slate-600">
                <p>
                  These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.
                </p>
                <p>
                  Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.
                </p>
                <p>
                  By accessing or using the Service You agree to be bound by these Terms and Conditions. If You disagree with any part of these Terms and Conditions then You may not access the Service.
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                  <p className="font-semibold text-amber-800">
                    Age Requirement: You represent that you are over the age of 18. The Company does not permit those under 18 to use the Service.
                  </p>
                </div>
                <p>
                  Your access to and use of the Service is also conditioned on Your acceptance of and compliance with the Privacy Policy of the Company. Our Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your personal information when You use the Application or the Website and tells You about Your privacy rights and how the law protects You. Please read Our Privacy Policy carefully before using Our Service.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Terms Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Globe className="h-6 w-6 text-teal-700" />
                  Links to Other Websites
                </h3>
                <p className="text-slate-600 mb-3">
                  Our Service may contain links to third-party web sites or services that are not owned or controlled by the Company.
                </p>
                <p className="text-slate-600">
                  The Company has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. We strongly advise You to read the terms and conditions and privacy policies of any third-party web sites or services that You visit.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-teal-700" />
                  Termination
                </h3>
                <p className="text-slate-600 mb-3">
                  We may terminate or suspend Your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions.
                </p>
                <p className="text-slate-600">
                  Upon termination, Your right to use the Service will cease immediately.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-teal-700" />
                  Limitation of Liability
                </h3>
                <p className="text-slate-600">
                  The entire liability of the Company and any of its suppliers under any provision of this Terms shall be limited to the amount actually paid by You through the Service or 100 USD if You haven't purchased anything through the Service.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Gavel className="h-6 w-6 text-teal-700" />
                  Governing Law
                </h3>
                <p className="text-slate-600 mb-3">
                  The laws of Sri Lanka, excluding its conflicts of law rules, shall govern this Terms and Your use of the Service.
                </p>
                <p className="text-slate-600">
                  If You have any concern or dispute about the Service, You agree to first try to resolve the dispute informally by contacting the Company.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">"AS IS" and "AS AVAILABLE" Disclaimer</h2>
              
              <div className="space-y-4 text-slate-600">
                <p>
                  The Service is provided to You "AS IS" and "AS AVAILABLE" and with all faults and defects without warranty of any kind. To the maximum extent permitted under applicable law, the Company, on its own behalf and on behalf of its Affiliates and its and their respective licensors and service providers, expressly disclaims all warranties, whether express, implied, statutory or otherwise, with respect to the Service.
                </p>
                
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <h4 className="font-semibold text-red-800 mb-2">Important Notice:</h4>
                  <p className="text-red-700">
                    The Company provides no warranty that the Service will meet Your requirements, achieve any intended results, be compatible or work with any other software, applications, systems or services, operate without interruption, meet any performance or reliability standards or be error free.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Terms */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">For European Union (EU) Users</h3>
                <p className="text-slate-600">
                  If You are a European Union consumer, you will benefit from any mandatory provisions of the law of the country in which You are resident.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">United States Legal Compliance</h3>
                <p className="text-slate-600">
                  You represent and warrant that You are not located in a country subject to US government embargo or designated as a "terrorist supporting" country, and You are not listed on any US government list of prohibited or restricted parties.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Severability and Waiver</h3>
                <p className="text-slate-600">
                  If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Changes to Terms</h3>
                <p className="text-slate-600">
                  We reserve the right to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-teal-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-xl text-teal-100 mb-8">
              If you have any questions about these Terms and Conditions, You can contact us:
            </p>
            <div className="space-y-4">
              <p className="text-lg">
                <strong>By email:</strong>{" "}
                <a href="mailto:info@rathagala.lk" className="text-teal-200 hover:text-white underline">
                  info@rathagala.lk
                </a>
              </p>
              <p className="text-lg">
                <strong>By visiting our contact page:</strong>{" "}
                <a href="https://rathagala.lk/contact" className="text-teal-200 hover:text-white underline">
                  https://rathagala.lk/contact
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              By using our service, you agree to these terms and conditions
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