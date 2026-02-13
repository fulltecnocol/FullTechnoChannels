
"use client";

import React, { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import { MockSidebar } from "./MockSidebar";
import { MockRevenueChart } from "./MockRevenueChart";
import { MockChannelCard } from "./MockChannelCard";
import { Zap, Users, TrendingUp } from "lucide-react";

export function ProductShowcase() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // 3D & Layout Transforms
    const rotateX = useTransform(scrollYProgress, [0, 0.3], [20, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.3], [0.8, 1]);
    const opacity = useTransform(scrollYProgress, [0, 0.1], [0.5, 1]);
    const y = useTransform(scrollYProgress, [0, 0.3], [100, 0]);

    // Feature Highlights
    const sidebarX = useTransform(scrollYProgress, [0.3, 0.4], [-50, 0]);
    const sidebarOpacity = useTransform(scrollYProgress, [0.3, 0.4], [0.5, 1]);

    const chartScale = useTransform(scrollYProgress, [0.4, 0.5], [0.95, 1.05]);
    const chartGlow = useTransform(scrollYProgress, [0.4, 0.5], ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 30px rgba(255, 170, 0, 0.3)"]);

    const cardY = useTransform(scrollYProgress, [0.5, 0.6], [50, 0]);
    const cardOpacity = useTransform(scrollYProgress, [0.5, 0.6], [0, 1]);

    return (
        <section ref={containerRef} className="h-[250vh] relative bg-background">
            <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden perspective-1000">

                {/* Background Grid */}
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:40px_40px] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

                {/* Text Overlays - Sycned with scroll */}
                <div className="absolute top-20 z-20 text-center w-full px-4">
                    <motion.div
                        style={{ opacity: useTransform(scrollYProgress, [0, 0.2, 0.3], [1, 1, 0]), y: useTransform(scrollYProgress, [0, 0.3], [0, -50]) }}
                        className="space-y-2"
                    >
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
                            Tu Centro de <span className="gradient-text">Comando</span>
                        </h2>
                        <p className="text-muted text-sm md:text-base">Todo lo que necesitas para escalar tu comunidad.</p>
                    </motion.div>
                </div>

                {/* 3D Dashboard Container */}
                <motion.div
                    style={{
                        rotateX,
                        scale,
                        opacity,
                        y,
                        perspective: 1000,
                    }}
                    className="relative w-[95%] max-w-6xl aspect-video bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex"
                >
                    {/* Sidebar Mock */}
                    <motion.div
                        style={{ x: sidebarX, opacity: sidebarOpacity }}
                        className="w-16 md:w-64 border-r border-white/5 h-full shrink-0 z-10 bg-surface/50 backdrop-blur-md"
                    >
                        <MockSidebar />
                    </motion.div>

                    {/* Main Content Mock */}
                    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 bg-gradient-to-br from-background to-surface/20">
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
                            {/* Revenue Chart - Highlighted */}
                            <div className="md:col-span-2 h-full flex flex-col gap-6">
                                <motion.div
                                    style={{ scale: chartScale, boxShadow: chartGlow }}
                                    className="flex-1 rounded-xl overflow-hidden relative"
                                >
                                    <MockRevenueChart />
                                </motion.div>

                                <div className="h-32 rounded-xl border border-white/5 p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">4,285</div>
                                        <div className="text-xs text-muted font-bold uppercase">Suscriptores Activos</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Channel & Activity */}
                            <div className="flex flex-col gap-6">
                                <motion.div style={{ y: cardY, opacity: cardOpacity }}>
                                    <MockChannelCard />
                                </motion.div>

                                <div className="flex-1 rounded-xl border border-white/5 p-4 space-y-4">
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

            </div>
        </section>
    );
}
