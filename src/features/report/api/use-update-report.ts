import { toast } from "sonner";
import { useId } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { UpdateReportSchema } from "@/server/routes/report/report.schemas";

interface UpdateReportParams {
  id: string;
  values: UpdateReportSchema;
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  const toastId = useId();

  const mutation = useMutation({
    mutationFn: async ({ id, values }: UpdateReportParams) => {
      // Use PUT to match route configuration
      const res = await client.api.report[":id"].$put({
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
        let message = `Failed to update report (status ${res.status})`;

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
        console.error("Update report failed", {
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
      toast.loading("Updating report...", { id: toastId });
    },
    onSuccess: (data) => {
      toast.success("Report updated successfully", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      // Invalidate single report query if exists
      queryClient.invalidateQueries({ queryKey: ["report", data.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update report", { id: toastId });
    },
  });

  return mutation;
}
