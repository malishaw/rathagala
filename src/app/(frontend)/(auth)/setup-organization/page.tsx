"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditIcon, FileEditIcon, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { createOrgSchema, CreateOrgSchema } from "@/features/organizations/schemas/create-org.schema";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MediaGallery } from "@/modules/media/components/media-gallery";
import { useCreateOrganization } from "@/features/organizations/api/use-create-organization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetupOrganizationPage() {
  const router = useRouter();
  const { isPending, mutate } = useCreateOrganization();

  const form = useForm<CreateOrgSchema>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      description: "",
      logo: ""
    }
  });

  async function onSubmit(values: CreateOrgSchema) {
    mutate(values, {
      onSuccess() {
        form.reset();
        router.push("/dashboard");
      }
    });
  }

  function handleSkip() {
    router.push("/signin");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <Logo />
          <h1 className="text-3xl font-bold tracking-tight font-heading">
            Setup Your Organization
          </h1>
          <p className="text-base text-muted-foreground text-center">
            Create your organization to get started
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              Fill in the details below to create your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Organization Logo */}
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                      <FormLabel>Organization Logo</FormLabel>
                      <FormControl>
                        <MediaGallery
                          initialTab="upload"
                          multiSelect={false}
                          title="Select or Upload Organization Logo"
                          onMediaSelect={(media) => {
                            field.onChange(media[0].url);
                          }}
                        >
                          {field.value ? (
                            <Avatar className="group w-24 h-24 rounded-full relative transition-all cursor-pointer">
                              <AvatarImage
                                src={field.value}
                                alt="Organization logo"
                                width={400}
                                height={400}
                                className="object-cover"
                              />
                              <AvatarFallback>
                                <ImageIcon className="h-10 w-10 text-neutral-400" />
                              </AvatarFallback>

                              <div className="absolute hidden group-hover:flex w-full h-full top-0 bg-black/70 text-white transition-all ease-in-out duration-75 rounded-full items-center justify-center">
                                <EditIcon className="h-6 w-6" />
                              </div>
                            </Avatar>
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-muted/20 border-2 border-primary/80 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors">
                              <FileEditIcon className="h-10 w-10 text-neutral-400" />
                            </div>
                          )}
                        </MediaGallery>
                      </FormControl>
                      <FormDescription>
                        Optional: Upload a logo for your organization
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter organization name"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Organization description (optional)"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Brief description of your organization
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-4" />

                <div className="flex flex-col space-y-2">
                  <Button type="submit" disabled={isPending} loading={isPending} className="w-full">
                    {isPending ? "Creating..." : "Create Organization"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={handleSkip}
                    disabled={isPending}
                    className="w-full"
                  >
                    Skip for now
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
