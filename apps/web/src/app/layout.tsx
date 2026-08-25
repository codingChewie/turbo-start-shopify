import "@workspace/ui/globals.css";

import { SanityLive } from "@workspace/sanity/live";
import { Toaster } from "@workspace/ui/components/sonner";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { preconnect, prefetchDNS } from "react-dom";

import { CartToasts } from "@/components/cart/cart-toasts";
import { FooterServer } from "@/components/footer";
import { CombinedJsonLd } from "@/components/json-ld";
import { Navbar } from "@/components/navbar";
import { PreviewBar } from "@/components/preview-bar";
import { PromoBanner } from "@/components/promo-banner";
import { Providers } from "@/components/providers";
import { getNavigationData } from "@/lib/navigation";

const fontSans = GeistSans;
const fontMono = GeistMono;

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  preconnect("https://cdn.sanity.io");
  prefetchDNS("https://cdn.sanity.io");
  const nav = await getNavigationData();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <PromoBanner data={nav.promoBannerData} />
            <Navbar
              navbarData={nav.navbarData}
              settingsData={nav.settingsData}
            />
            <div className="flex-1">{children}</div>
            {/* Deliberately not wrapped in Suspense. A boundary here streams
             * the resolved footer into a trailing `<div hidden>` and swaps it
             * in with an inline script, so with JavaScript off every page on
             * the site ended in a permanent skeleton. Blocking on it instead
             * puts the real footer in the initial HTML, and costs nothing that
             * was not already being paid: `getNavigationData()` above is an
             * unguarded Sanity await, so the layout already blocks on the
             * Content Lake before any HTML flushes. */}
            <FooterServer />
          </div>
          {modal}
          <CartToasts />
          <Toaster position="bottom-right" richColors />
          <SanityLive />
          <CombinedJsonLd includeOrganization includeWebsite />
          {(await draftMode()).isEnabled && (
            <>
              <PreviewBar />
              <VisualEditing />
            </>
          )}
        </Providers>
      </body>
    </html>
  );
}
