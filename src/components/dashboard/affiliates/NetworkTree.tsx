import { useState } from 'react';
import { AffiliateNode } from '@/lib/types';
import { ChevronRight, ChevronDown, User, Shield, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NetworkTreeProps {
    data: AffiliateNode[];
    loading?: boolean;
}

const TreeNode = ({ node, level }: { node: AffiliateNode; level: number }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = node.children && node.children.length > 0;

    // Node styling based on level
    const isRoot = level === 1; // Assuming root's direct children are level 1 in this context relative to the viewer

    // Level Badge Colors
    const getLevelColor = (lvl: number) => {
        if (lvl === 1) return "bg-amber-500 text-black border-amber-500";
        if (lvl === 2) return "bg-amber-500/80 text-black border-amber-500/50";
        if (lvl <= 5) return "bg-zinc-800 text-amber-500 border-amber-500/30";
        return "bg-zinc-900 text-zinc-500 border-zinc-800";
    };

    return (
        <div className="flex flex-col">
            {/* Node Card */}
            <div
                className={`
                    relative flex items-center gap-3 p-3 rounded-xl border border-l-4 transition-all cursor-pointer
                    ${isOpen ? 'bg-zinc-800/50 border-amber-500/50' : 'bg-surface border-surface-border hover:bg-surface-hover'}
                    ${level === 1 ? 'border-l-amber-500' : 'border-l-zinc-700'}
                `}
                style={{ marginLeft: `${(level - 1) * 24}px` }}
                onClick={() => hasChildren && setIsOpen(!isOpen)}
            >
                {/* Connector Line (Vertical) */}
                {level > 1 && (
                    <div
                        className="absolute -left-[24px] top-1/2 w-[24px] h-[2px] bg-zinc-800"
                        style={{ borderBottomLeftRadius: '8px' }}
                    />
                )}
                {/* Connector Line (Horizontal hook from parent) - Handled by CSS structure mostly or simplified */}

                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 shrink-0">
                    {node.avatar_url ? (
                        <img src={node.avatar_url} alt={node.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User className={`w-4 h-4 ${level === 1 ? 'text-amber-500' : 'text-zinc-500'}`} />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold truncate ${level === 1 ? 'text-white' : 'text-zinc-300'}`}>
                            {node.name}
                        </p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${getLevelColor(level)}`}>
                            L{level}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-0.5">
                        <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500/50" />
                            {node.total_referrals} Referidos
                        </span>
                        {node.join_date && (
                            <span>Joined: {new Date(node.join_date).toLocaleDateString()}</span>
                        )}
                    </div>
                </div>

                {hasChildren && (
                    <div className={`p-1 rounded-full transition-transform ${isOpen ? 'rotate-180 bg-white/10' : ''}`}>
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                    </div>
                )}
            </div>

            {/* Recursion */}
            <AnimatePresence>
                {isOpen && hasChildren && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative"
                    >
                        {/* Vertical line connector for children */}
                        <div
                            className="absolute left-[15px] top-0 bottom-4 w-[2px] bg-zinc-800"
                            style={{ left: `${(level - 1) * 24 + 16}px` }}
                        />

                        <div className="pt-2 space-y-2">
                            {node.children.map(child => (
                                <TreeNode key={child.id} node={child} level={level + 1} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export function NetworkTree({ data, loading }: NetworkTreeProps) {
    if (loading) return <div className="p-10 text-center animate-pulse text-zinc-500">Cargando la matrix...</div>;

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                <div className="p-4 bg-zinc-900 rounded-full mb-4">
                    <Shield className="w-8 h-8 text-zinc-700" />
                </div>
                <h3 className="text-zinc-400 font-bold mb-1">Tu red está vacía</h3>
                <p className="text-sm text-zinc-600 max-w-xs">Invita a creadores para comenzar a construir tu imperio.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {data.map(node => (
                <TreeNode key={node.id} node={node} level={1} />
            ))}
        </div>
    );
}
