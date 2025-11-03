import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useId } from "react";
import { betterFetch } from "@better-fetch/fetch";

import { authClient } from "@/lib/auth-client";
import { CreateOrgSchema } from "../schemas/create-org.schema";
import { toKebabCase } from "@/lib/utils";

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  const toastId = useId();

  const mutation = useMutation({
    mutationFn: async (values: CreateOrgSchema) => {
      const { data, error } = await authClient.organization.create({
        name: values.name,
        slug: toKebabCase(values.name),
        logo: values.logo || undefined,
        metadata: {
          description: values.description
        }
      });

      if (error) throw new Error(error.message);

      // After organization is created, update user's organizationId
      // Check both possible response structures from better-auth
      // better-auth returns: { organization: { id: "...", name: "...", ... } }
      const orgId = data?.organization?.id || data?.id;
      
      console.log("Organization creation response:", JSON.stringify(data, null, 2));
      console.log("Extracted organizationId:", orgId);
      
      if (orgId) {
        try {
          console.log("Calling API to update user organizationId with:", orgId);
          const updateResponse = await betterFetch("/api/users/update-organization-id", {
            method: "PATCH",
            body: {
              organizationId: orgId
            }
          });

          console.log("Update API response:", updateResponse);

          if (updateResponse.error) {
            console.error("Failed to update user organizationId:", updateResponse.error);
            toast.error("Organization created but failed to link to your account. Please contact support.", {
              id: toastId
            });
          } else if (updateResponse.data) {
            console.log("Successfully updated user organizationId:", updateResponse.data);
            // Show success message
            toast.success("Organization linked to your account!", {
              id: toastId
            });
          } else {
            console.warn("Update response received but no data field:", updateResponse);
          }
        } catch (updateError) {
          console.error("Error updating user organizationId:", updateError);
          toast.error("Organization created but failed to link to your account. Please contact support.", {
            id: toastId
          });
        }
      } else {
        console.error("No organization ID found in response:", JSON.stringify(data, null, 2));
        toast.warning("Organization created but could not retrieve ID. Please refresh and try again.", {
          id: toastId
        });
      }

      return data;
    },
    onMutate: () => {
      toast.loading("Creating new organization...", { id: toastId });
    },
    onSuccess: () => {
      toast.success("Organization created successfully !", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create organization", {
        id: toastId
      });
    }
  });

  return mutation;
};
