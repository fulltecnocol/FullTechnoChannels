import { Trophy, Star, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface GamificationCardProps {
    currentTier: string;
    referralCount: number;
    nextMin?: number;
}

export function GamificationCard({ currentTier, referralCount, nextMin }: GamificationCardProps) {
    // Logic for progress
    const progress = nextMin
        ? Math.min((referralCount / nextMin) * 100, 100)
        : 100;

    const getIcon = () => {
        if (currentTier === "DIAMANTE") return <Crown className="w-6 h-6 text-cyan-400" />;
        if (currentTier === "ORO") return <Trophy className="w-6 h-6 text-amber-400" />;
        return <Star className="w-6 h-6 text-orange-400" />;
    };

    const getGradient = () => {
        if (currentTier === "DIAMANTE") return "from-cyan-900 to-blue-900 border-cyan-500/30";
        if (currentTier === "ORO") return "from-amber-900/40 to-yellow-900/40 border-amber-500/30";
        return "from-zinc-800 to-zinc-900 border-zinc-700";
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl border p-6 bg-gradient-to-br ${getGradient()}`}>
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 p-8 opacity-10">
                {getIcon()}
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Rango Actual</p>
                        <h3 className="text-2xl font-black text-white flex items-center gap-2">
                            {currentTier} {getIcon()}
                        </h3>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Próximo Nivel</p>
                        {nextMin ? (
                            <span className="text-white font-bold">{nextMin - referralCount} Referidos más</span>
                        ) : (
                            <span className="text-emerald-400 font-bold">¡Nivel Máximo!</span>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-white/70">
                        <span>Progreso</span>
                        <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full rounded-full ${currentTier === "DIAMANTE" ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"}`}
                        />
                    </div>
                </div>

                {/* Next Tier Perks text */}
                <div className="mt-4 p-3 bg-black/20 rounded-lg border border-white/5 backdrop-blur-sm">
                    <p className="text-xs text-white/80 leading-relaxed">
                        {nextMin ? (
                            <span>🚀 <b>Siguiente Hito:</b> Desbloquea comisiones más altas y acceso a niveles profundos de tu red alcanzando el siguiente rango.</span>
                        ) : (
                            <span>💎 <b>Estado Elite:</b> Has desbloqueado el máximo potencial de ganancias de la plataforma. ¡Mantén el ritmo!</span>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
