import "@/styles/globals.css";
import Layout from "./layout/layout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
