import { redirect } from "next/navigation";

/**
 * Legacy ad detail page — server-side redirect to /ads/[id].
 * Using Next.js redirect() instead of client useEffect eliminates
 * the double-navigation penalty (no spinner, no JS bundle loaded first).
 */
export default async function LegacyAdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adId = Array.isArray(id) ? id[0] : id;

  if (!adId) redirect("/");
  redirect(`/ads/${adId}`);
}