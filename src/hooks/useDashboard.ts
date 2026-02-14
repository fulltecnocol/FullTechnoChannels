import { useState, useCallback } from "react";
import { ownerApi, adminApi } from "@/lib/api";
import { SummaryData, Channel, Withdrawal, SupportTicket, Payment, UserAdmin, ConfigItem } from "@/lib/types";

export function useDashboard(router: any) {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [user, setUser] = useState<SummaryData | null>(null);

    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [adminUsers, setAdminUsers] = useState<UserAdmin[]>([]);
    const [configs, setConfigs] = useState<ConfigItem[]>([]);
    const [adminWithdrawals, setAdminWithdrawals] = useState<Withdrawal[]>([]);
    const [adminTickets, setAdminTickets] = useState<SupportTicket[]>([]);

    const loadWithdrawals = useCallback(async () => {
        try {
            const data = await ownerApi.getWithdrawals();
            setWithdrawals(data);
        } catch (e) { console.error(e); }
    }, []);

    const loadTickets = useCallback(async () => {
        try {
            const data = await ownerApi.getTickets();
            setTickets(data);
        } catch (e) { console.error(e); }
    }, []);

    const loadAdminData = useCallback(async () => {
        try {
            const [users, config, wd, tk] = await Promise.all([
                adminApi.getUsers(),
                adminApi.getConfig(),
                adminApi.getWithdrawals(),
                adminApi.getTickets(),
            ]);
            setAdminUsers(users);
            setConfigs(config);
            setAdminWithdrawals(wd);
            setAdminTickets(tk);
        } catch (e) { console.error(e); }
    }, []);

    const fetchData = useCallback(async (background = false) => {
        try {
            if (!background) setLoading(true);
            const [channelsData, summaryData] = await Promise.all([
                ownerApi.getChannels(),
                ownerApi.getSummary(),
            ]);
            setChannels(channelsData);
            setSummary(summaryData);
            setUser(summaryData);

            if (summaryData?.is_admin) {
                try {
                    const pending = await adminApi.getPendingPayments();
                    setPendingPayments(pending || []);
                } catch (e) { console.error(e); }
            }
        } catch (err: any) {
            console.error("Error fetching dashboard data:", err);
            if (err.message.includes("401")) router.push("/login");
        } finally {
            if (!background) setLoading(false);
        }
    }, [router]);

    return {
        channels, setChannels,
        summary, setSummary,
        pendingPayments, setPendingPayments,
        loading, setLoading,
        activeTab, setActiveTab,
        user, setUser,
        withdrawals, setWithdrawals,
        tickets, setTickets,
        adminUsers, setAdminUsers,
        configs, setConfigs,
        adminWithdrawals, setAdminWithdrawals,
        adminTickets, setAdminTickets,
        fetchData, loadWithdrawals, loadTickets, loadAdminData
    };
}
