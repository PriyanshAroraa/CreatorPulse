import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    // Public routes that don't require authentication
    const publicRoutes = ["/", "/login", "/api/auth"];
    const isPublicRoute = publicRoutes.some(
        (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith("/api/auth")
    );

    // If accessing a protected route without being logged in, redirect to login
    if (!isLoggedIn && !isPublicRoute) {
        return NextResponse.redirect(new URL("/login", nextUrl));
    }

    // If logged in and trying to access login page, redirect to dashboard
    if (isLoggedIn && nextUrl.pathname === "/login") {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Match all routes except static files and api routes (except auth)
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
