import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async signIn({ user, account }) {
            // Sync user with backend on sign in
            if (account?.provider === "google") {
                try {
                    const response = await fetch(`${API_URL}/api/auth/google`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            access_token: account.access_token,
                            user: {
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                image: user.image,
                            },
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Store the backend token in the user object
                        (user as any).backendToken = data.access_token;
                    }
                } catch (error) {
                    console.error("Failed to sync with backend:", error);
                    // Continue anyway - backend might be optional
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            // Pass backend token to JWT
            if (user) {
                token.id = user.id;
                token.backendToken = (user as any).backendToken;
            }
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                // Include backend token in session for API calls
                (session as any).backendToken = token.backendToken;
                (session as any).accessToken = token.accessToken;
            }
            return session;
        },
    },
});
