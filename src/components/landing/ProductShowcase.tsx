
"use client";

import React from "react";
import { motion } from "framer-motion";
import { MockSidebar } from "./MockSidebar";
import { MockRevenueChart } from "./MockRevenueChart";
import { MockChannelCard } from "./MockChannelCard";
import { Users, TrendingUp } from "lucide-react";

export function ProductShowcase() {
    return (
        <section className="pt-20 pb-0 relative bg-background overflow-hidden">
            <div className="container mx-auto px-4">

                {/* Text Header */}
                <div className="text-center mb-8 space-y-4 relative z-10">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-black tracking-tighter"
                    >
                        Tu Centro de <span className="gradient-text">Comando</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-muted text-lg max-w-2xl mx-auto"
                    >
                        Todo lo que necesitas para escalar tu comunidad en una sola pantalla.
                    </motion.p>
                </div>

                {/* Dashboard Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40, rotateX: 10 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, type: "spring" }}
                    className="relative mx-auto max-w-6xl bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row aspect-auto md:aspect-video"
                >
                    {/* Sidebar Mock */}
                    <div className="hidden md:block w-64 border-r border-white/5 bg-surface/50 backdrop-blur-md shrink-0">
                        <MockSidebar />
                    </div>

                    {/* Main Content Mock */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 bg-gradient-to-br from-background to-surface/20">
                        {/* Header Mock */}
                        <div className="h-12 w-full flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="space-y-1">
                                <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                                <div className="h-3 w-48 bg-white/5 rounded" />
                            </div>
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/5" />
                                <div className="w-8 h-8 rounded-full bg-primary/20" />
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                            {/* Revenue Chart */}
                            <div className="md:col-span-2 flex flex-col gap-6">
                                <div className="flex-1 rounded-xl overflow-hidden relative min-h-[200px]">
                                    <MockRevenueChart />
                                </div>

                                <div className="h-32 rounded-xl border border-white/5 p-4 flex items-center gap-4 bg-surface/30">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">4,285</div>
                                        <div className="text-xs text-muted font-bold uppercase">Suscriptores Activos</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="flex flex-col gap-6">
                                <MockChannelCard />

                                <div className="flex-1 rounded-xl border border-white/5 p-4 space-y-4 bg-surface/30 min-h-[150px]">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-widest">
                                        <TrendingUp className="w-3 h-3" /> Actividad Reciente
                                    </div>
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/5" />
                                            <div className="space-y-1 flex-1">
                                                <div className="h-2 w-full bg-white/10 rounded" />
                                                <div className="h-2 w-1/2 bg-white/5 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Background Effects */}
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:40px_40px] pointer-events-none -z-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none -z-10" />
            </div>
        </section>
    );
}
