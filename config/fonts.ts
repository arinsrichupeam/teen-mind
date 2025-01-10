import { Prompt as FontPrompt } from "next/font/google";

export const fontPrompt = FontPrompt({
  subsets: ["thai"],
  variable: "--font-prompt",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
