import { auth } from "@/auth";

export default auth((req) => {
  // Middleware can be used to protect routes if needed
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

