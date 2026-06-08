"use client";

import React from "react";
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
      onSuccess(data) {
        form.reset();
        if (data?.organization?.id) {
          router.push(`/dashboard/organizations/${data.organization.id}`);
        } else {
          router.push("/dashboard");
        }
      }
    });
  }

  function handleSkip() {
    router.push("/signin");
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex flex-col items-center space-y-1">
        <h1 className="text-2xl font-bold tracking-tight font-heading text-teal-900">
          Setup Your Organization
        </h1>
        <p className="text-xs text-teal-600 text-center">
          Create your organization to get started
        </p>
      </div>

      <Card className="w-full border-teal-700/20 bg-white shadow-lg">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
          <CardTitle className="text-lg font-bold text-teal-900 leading-tight">Organization Details</CardTitle>
          <CardDescription className="text-xs text-teal-700">
            Fill in the details below to create your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel className="text-xs font-medium text-teal-900">Organization Logo</FormLabel>
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
                          <Avatar className="group w-20 h-20 rounded-full relative transition-all cursor-pointer">
                            <AvatarImage
                              src={field.value}
                              alt="Organization logo"
                              width={400}
                              height={400}
                              className="object-cover"
                            />
                            <AvatarFallback>
                              <ImageIcon className="h-8 w-8 text-neutral-400" />
                            </AvatarFallback>

                            <div className="absolute hidden group-hover:flex w-full h-full top-0 bg-black/70 text-white transition-all ease-in-out duration-75 rounded-full items-center justify-center">
                              <EditIcon className="h-5 w-5" />
                            </div>
                          </Avatar>
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-muted/20 border-2 border-primary/80 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors">
                            <FileEditIcon className="h-8 w-8 text-neutral-400" />
                          </div>
                        )}
                      </MediaGallery>
                    </FormControl>
                    <FormDescription className="text-[10px] text-teal-700/80">
                      Optional: Upload a logo for your organization
                    </FormDescription>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-teal-900">Organization Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter organization name"
                        disabled={isPending}
                        className="bg-white border-teal-200 h-9 text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-100 shadow-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-teal-900">Description</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Organization description (optional)"
                        disabled={isPending}
                        className="bg-white border-teal-200 h-9 text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-100 shadow-xs"
                      />
                    </FormControl>
                    <FormDescription className="text-[10px] text-teal-700/80">
                      Optional: Brief description of your organization
                    </FormDescription>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <Separator className="my-3 bg-teal-100" />

              <div className="flex flex-col space-y-2">
                <Button type="submit" disabled={isPending} loading={isPending} className="w-full bg-teal-700 hover:bg-teal-800 h-9 text-xs font-semibold">
                  {isPending ? "Creating..." : "Create Organization"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleSkip}
                  disabled={isPending}
                  className="w-full text-xs text-teal-700 hover:text-teal-900"
                >
                  Skip for now
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

