import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StartupRisk.ai — AI Startup Failure Prediction",
  description:
    "Get an AI-powered risk assessment for your startup in 5 minutes. Backed by machine learning trained on thousands of startup outcomes. Actionable recommendations to reduce your failure risk.",
  keywords: "startup risk, failure prediction, AI assessment, startup analysis, risk score",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F7F9FB] text-slate-800">{children}</body>
    </html>
  );
}
