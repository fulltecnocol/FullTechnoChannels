
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Globe, Instagram, Twitter, Linkedin, Facebook, Youtube, Github, Mail, Link as LinkIcon } from "lucide-react";

// Types (Mirrors Backend)
interface ProfileLink {
    id: number;
    title: string;
    url: string;
    icon: string | null;
    order_index: number;
}

interface PublicProfile {
    id: number;
    slug: string;
    display_name: string;
    bio: string | null;
    avatar_url: string | null;
    theme_color: string;
    background_image_url: string | null;
    links: ProfileLink[];
}

async function getProfile(slug: string): Promise<PublicProfile | null> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/p/${slug}`, {
            next: { revalidate: 60 }, // ISR: Cache for 60 seconds
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        return null;
    }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const profile = await getProfile(params.slug);
    if (!profile) return { title: "Perfil no encontrado" };

    return {
        title: `${profile.display_name} | FGate Bio`,
        description: profile.bio || `Perfil oficial de ${profile.display_name} en FGate.`,
        openGraph: {
            images: profile.avatar_url ? [profile.avatar_url] : [],
        }
    };
}

export default async function PublicProfilePage({ params }: { params: { slug: string } }) {
    const profile = await getProfile(params.slug);

    if (!profile) {
        notFound();
    }

    const contrastColor = calculateContrast(profile.theme_color);

    // Sort links
    const links = profile.links.sort((a, b) => a.order_index - b.order_index);

    return (
        <div
            className="min-h-screen w-full flex flex-col items-center justify-center p-6 selection:bg-white/30"
            style={{
                backgroundColor: profile.theme_color,
                color: contrastColor,
                backgroundImage: profile.background_image_url ? `url(${profile.background_image_url})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center"
            }}
        >
            {/* Overlay for readability if bg image exists */}
            {profile.background_image_url && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm -z-10" />
            )}

            <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in zoom-in duration-500">

                {/* Header */}
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl relative group">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.display_name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-black bg-white/10 backdrop-blur-md uppercase">
                                {profile.display_name[0]}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-lg">
                            {profile.display_name}
                        </h1>
                        {profile.bio && (
                            <p className="text-sm md:text-base font-medium opacity-90 max-w-sm mx-auto leading-relaxed drop-shadow-md">
                                {profile.bio}
                            </p>
                        )}
                    </div>
                </div>

                {/* Links */}
                <div className="space-y-4 w-full">
                    {links.map((link) => (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block w-full p-4 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl relative overflow-hidden"
                            style={{ color: contrastColor }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                            <div className="flex items-center justify-center relative z-10 font-bold text-center">
                                {/* Optional Icon could go here */}
                                {link.title}
                            </div>
                        </a>
                    ))}

                    {links.length === 0 && (
                        <div className="text-center opacity-60 text-sm py-4">
                            Este perfil aún no tiene enlaces públicos.
                        </div>
                    )}
                </div>

                {/* Footer brand */}
                <div className="pt-8 text-center">
                    <a
                        href="https://fgate.co"
                        target="_blank"
                        className="inline-flex items-center gap-2 text-xs font-bold opacity-50 hover:opacity-100 transition-opacity uppercase tracking-widest"
                        style={{ color: contrastColor }}
                    >
                        <Globe className="w-3 h-3" /> Powered by FGate
                    </a>
                </div>

            </div>
        </div>
    );
}

// Helper: Determine text color (black/white) based on background hex
function calculateContrast(hex: string) {
    if (!hex) return "#ffffff";
    // Remove # if present
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}
