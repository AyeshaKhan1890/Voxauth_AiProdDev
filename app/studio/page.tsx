import type { Metadata } from "next";
import { StudioPage } from "@/components/studio-page";

export const metadata: Metadata = {
  title: "Authenticity Studio",
  description: "Analyze recordings and review voice-authenticity evidence.",
};

export default function Studio() {
  return <StudioPage />;
}
