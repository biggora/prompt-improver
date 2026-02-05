import createMiddleware from "next-intl/middleware";

const proxy = createMiddleware({
  // A list of all locales that are supported
  locales: ["en", "ru", "de", "fr", "es"],

  // Used when no locale matches
  defaultLocale: "en",
});

export { proxy };

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(en|ru|de|fr|es)/:path*"],
};
