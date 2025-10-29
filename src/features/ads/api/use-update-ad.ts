import { toast } from "sonner";
import { useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { CreateAdSchema } from "@/server/routes/ad/ad.schemas";

interface UpdateAdParams {
  id: string;
  values: CreateAdSchema;
}

export function useUpdateAd() {
  const queryClient = useQueryClient();
  const toastId = useId();

  const mutation = useMutation({
    mutationFn: async ({ id, values }: UpdateAdParams) => {
      // Use PUT to match route configuration
      const res = await client.api.ad[":id"].$put({
        param: { id },
        json: values,
      });

      if (!res.ok) {
        // Clone response so we can try parsing as JSON and as text without consuming the body twice
        const cloned = res.clone();
        let errJson: any = null;
        let errText: string | null = null;

        try {
          errJson = await cloned.json();
        } catch (e) {
          // ignore
        }

        try {
          errText = await res.text();
        } catch (e) {
          // ignore
        }

        // Build a friendly message from common server validation shapes (e.g. ZodError)
        let message = `Failed to update ad (status ${res.status})`;

        if (errJson) {
          // If server supplies a top-level `message` use it
          if (typeof errJson.message === "string" && errJson.message.trim()) {
            message = errJson.message;
          } else if (errJson.error) {
            // Handle Zod-like error shape: { error: { issues: [ { message, path, ... } ] } }
            const err = errJson.error;
            if (Array.isArray(err.issues) && err.issues.length > 0) {
              try {
                message = err.issues
                  .map((iss: any) => {
                    const path = Array.isArray(iss.path) && iss.path.length ? ` (field: ${iss.path.join(".")})` : "";
                    return `${iss.message}${path}`;
                  })
                  .join("; ");
              } catch (e) {
                message = JSON.stringify(err);
              }
            } else if (typeof err === "string") {
              message = err;
            } else {
              message = JSON.stringify(err);
            }
          } else {
            // Fallback to stringifying the JSON body
            try {
              message = typeof errJson === "string" ? errJson : JSON.stringify(errJson);
            } catch (e) {
              // keep default
            }
          }
        } else if (errText && errText.trim()) {
          message = errText.trim();
        }

        // Log detailed info to help debugging (status, parsed json, raw text, url)
        // eslint-disable-next-line no-console
        console.error("Update ad failed", {
          status: res.status,
          statusText: res.statusText,
          json: errJson,
          text: errText,
          url: res.url,
          message
        });

        throw new Error(message);
      }

      return await res.json();
    },
    onMutate: () => {
      toast.loading("Updating Ad...", { id: toastId });
    },
    onSuccess: (data) => {
      toast.success("Ad updated successfully", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      // This should match how your useGetAdById hook is structured
      queryClient.invalidateQueries({ queryKey: ["ad", data.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update ad", { id: toastId });
    },
  });

  return mutation;
}
