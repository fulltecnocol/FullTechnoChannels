"use client";

import { motion } from "framer-motion";
import { Trophy, Users, TrendingUp, Award } from "lucide-react";
import { LeaderboardEntry } from "@/lib/types";

interface LeaderboardCardProps {
    entries: LeaderboardEntry[];
}

export function LeaderboardCard({ entries }: LeaderboardCardProps) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Ranking Global</h3>
                        <p className="text-xs text-zinc-500">Top 10 Afiliados del Mundo</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {entries.map((entry, index) => (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${index < 3 ? "bg-zinc-800/40 border border-zinc-700/50" : "hover:bg-zinc-800/20"
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${index === 0 ? "bg-yellow-500 text-black" :
                                    index === 1 ? "bg-zinc-300 text-black" :
                                        index === 2 ? "bg-amber-600 text-black" : "text-zinc-500"
                                }`}>
                                {index + 1}
                            </div>

                            <div className="flex items-center gap-3">
                                {entry.avatar ? (
                                    <img src={entry.avatar} alt={entry.name} className="w-10 h-10 rounded-full border border-zinc-700" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                        {entry.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                        {entry.name}
                                        <div className="flex gap-1">
                                            {entry.badges.map(badge => (
                                                <span key={badge.id} title={badge.name} className="text-xs">{badge.icon}</span>
                                            ))}
                                        </div>
                                    </h4>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                            <Users className="w-3 h-3" />
                                            {entry.referrals}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                            <TrendingUp className="w-3 h-3" />
                                            ${entry.earnings.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-sm font-mono font-bold text-green-400">
                                +${(entry.earnings / 12).toFixed(2)}/mo
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/50 flex justify-center">
                <button className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                    <Award className="w-3 h-3" />
                    Cómo subir en el ranking
                </button>
            </div>
        </div>
    );
}
