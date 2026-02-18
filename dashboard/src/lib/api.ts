import {
    AuthResponse, SummaryData, Channel, Withdrawal, SupportTicket,
    TicketDetailsResponse, ConfigItem, AnalyticsData, Promotion, Payment,
    LegalInfo, LegalStatus, UserAdmin, AdminAffiliateStats, AffiliateLedgerEntry,
    AffiliateNetworkResponse, AffiliateRank, RankCreate, AffiliateStats, LeaderboardEntry
} from "./types";

// Hardcoded for production stability
const API_URL = "https://membership-backend-1054327025113.us-central1.run.app";
// const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://membership-backend-1054327025113.us-central1.run.app";

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error en la petición a la API");
    }

    return response.json();
}

export const ownerApi = {
    getSummary: () => apiRequest<SummaryData>("/api/owner/dashboard/summary"),
    getChannels: () => apiRequest<Channel[]>("/api/owner/channels"),
    createChannel: (title: string) => apiRequest<Channel>("/api/owner/channels", {
        method: "POST",
        body: JSON.stringify({ title }),
    }),
    deleteChannel: (id: number, confirm: boolean = false) => apiRequest<void>(`/api/owner/channels/${id}${confirm ? '?confirm=true' : ''}`, { method: "DELETE" }),
    getDeleteChannelCost: (id: number) => apiRequest<any>(`/api/owner/channels/${id}/delete-cost`),
    getWithdrawals: () => apiRequest<Withdrawal[]>("/api/owner/withdrawals"),
    requestWithdrawal: (data: { amount: number; method: string; details: string }) => apiRequest<Withdrawal>("/api/owner/withdrawals", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    getTickets: () => apiRequest<SupportTicket[]>("/api/owner/tickets"),
    createTicket: (data: { subject: string; content: string }) => apiRequest<SupportTicket>("/api/owner/tickets", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    getTicketDetails: (id: number) => apiRequest<TicketDetailsResponse>(`/api/owner/tickets/${id}`),
    replyTicket: (id: number, content: string) => apiRequest<void>(`/api/owner/tickets/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ content }),
    }),
    updateBranding: (channelId: number, data: { welcome_message: string; expiration_message: string }) => apiRequest<Channel>(`/api/owner/channels/${channelId}/branding`, {
        method: "POST",
        body: JSON.stringify(data),
    }),
    updateProfile: (data: { full_name: string; avatar_url: string }) => apiRequest<void>("/api/owner/profile", {
        method: "PUT",
        body: JSON.stringify(data),
    }),
    updatePassword: (data: any) => apiRequest<void>("/api/owner/password", {
        method: "PUT",
        body: JSON.stringify(data),
    }),
    getPromotions: (channelId: number) => apiRequest<Promotion[]>(`/api/owner/channels/${channelId}/promotions`),
    createPromotion: (channelId: number, data: any) => apiRequest<Promotion>(`/api/owner/channels/${channelId}/promotions`, {
        method: "POST",
        body: JSON.stringify(data),
    }),
    deletePromotion: (promoId: number) => apiRequest<void>(`/api/owner/promotions/${promoId}`, {
        method: "DELETE",
    }),
    getAnalytics: () => apiRequest<AnalyticsData>("/api/owner/analytics"),
    getProfile: () => apiRequest<any>("/api/owner/profile"),
};

export const authApi = {
    isAuthenticated: () => typeof window !== 'undefined' && !!localStorage.getItem("token"),
    logout: () => {
        if (typeof window !== 'undefined') localStorage.removeItem("token");
        window.location.href = "/login";
    },
    me: () => ownerApi.getProfile(),
    login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
        const formData = new URLSearchParams();
        formData.append("username", data.email);
        formData.append("password", data.password);
        console.log("LOGIN REQUEST:", { url: `${API_URL}/api/token`, username: data.email });
        return fetch(`${API_URL}/api/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        }).then(async (res) => {
            if (!res.ok) {
                const text = await res.text();
                console.error("LOGIN FAILED:", res.status, text);
                throw new Error(`Login failed: ${res.status} ${text}`);
            }
            return res.json();
        });
    },
    register: (data: any) => {
        console.log("REGISTER REQUEST:", { url: `${API_URL}/api/register`, data });
        return apiRequest<void>("/api/register", {
            method: "POST",
            body: JSON.stringify({
                email: data.email,
                password: data.password,
                full_name: data.fullName,
                referral_code: data.referral_code,
                registration_token: data.registration_token
            }),
        });
    },
    googleAuth: (credential: string, referralCode?: string, registrationToken?: string) => apiRequest<AuthResponse>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential, referral_code: referralCode, registration_token: registrationToken }),
    }),
    magicLogin: (token: string) => apiRequest<AuthResponse>(`/api/auth/magic-login?token=${token}`, {
        method: "POST",
    }),
};

export const usersApi = ownerApi;
export const walletApi = ownerApi;
export const channelApi = ownerApi;
export const supportApi = ownerApi;

export const adminApi = {
    getConfig: () => apiRequest<ConfigItem[]>("/api/admin/config"),
    updateConfig: (key: string, value: number) => apiRequest<ConfigItem>("/api/admin/config", {
        method: "POST",
        body: JSON.stringify({ key, value }),
    }),
    getWithdrawals: () => apiRequest<Withdrawal[]>("/api/admin/withdrawals"),
    processWithdrawal: (id: number, status: string) => apiRequest<Withdrawal>(`/api/admin/withdrawals/${id}/process`, {
        method: "POST",
        body: JSON.stringify({ status }),
    }),
    getTickets: () => apiRequest<SupportTicket[]>("/api/admin/tickets"),
    getTicketDetails: (id: number) => apiRequest<TicketDetailsResponse>(`/api/admin/tickets/${id}`),
    replyTicket: (id: number, content: string) => apiRequest<void>(`/api/admin/tickets/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ content }),
    }),
    getPayments: () => apiRequest<Payment[]>("/api/admin/payments/pending"),
    verifyPayment: (id: number) => apiRequest<Payment>(`/api/admin/payments/${id}/verify-crypto`, {
        method: "POST",
    }),
    getUsers: () => apiRequest<UserAdmin[]>("/api/admin/users"),
    getTaxSummary: (year?: number) => apiRequest<any>(`/api/admin/tax/summary${year ? `?year=${year}` : ''}`),
    getExpenses: (year?: number) => apiRequest<any[]>(`/api/admin/expenses${year ? `?year=${year}` : ''}`),
    createExpense: (data: any) => apiRequest<any>(`/api/admin/expenses`, { method: "POST", body: JSON.stringify(data) }),
    deleteExpense: (id: number) => apiRequest<void>(`/api/admin/expenses/${id}`, { method: "DELETE" }),
    // User Management
    updateUplink: (userId: number, referrerId: number) => apiRequest<void>(`/api/admin/users/${userId}/uplink`, {
        method: "PATCH",
        body: JSON.stringify({ referrer_id: referrerId }),
    }),
    deleteUser: (userId: number) => apiRequest<void>(`/api/admin/users/${userId}`, { method: "DELETE" }),
    getSignedContract: async (userId: number) => {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/admin/users/${userId}/contract`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Error descargando contrato");
        return response.blob();
    },
    // Affiliate Admin
    getAffiliateStats: () => apiRequest<AdminAffiliateStats>("/api/admin/affiliates/stats"),
    getAffiliateLedger: (limit: number, offset: number) => apiRequest<AffiliateLedgerEntry[]>(`/api/admin/affiliates/ledger?limit=${limit}&offset=${offset}`),
    getAffiliateTree: (userId: number) => apiRequest<AffiliateNetworkResponse>(`/api/admin/affiliates/tree/${userId}`),
    getAffiliateRanks: () => apiRequest<AffiliateRank[]>("/api/admin/ranks"),
    createAffiliateRank: (data: RankCreate) => apiRequest<AffiliateRank>("/api/admin/ranks", { method: "POST", body: JSON.stringify(data) }),
    updateAffiliateRank: (id: number, data: RankCreate) => apiRequest<AffiliateRank>(`/api/admin/ranks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteAffiliateRank: (id: number) => apiRequest<void>(`/api/admin/ranks/${id}`, { method: "DELETE" }),
};

export const affiliateApi = {
    getNetwork: () => apiRequest<AffiliateNetworkResponse>("/api/affiliate/network"),
    getStats: () => apiRequest<AffiliateStats>("/api/affiliate/stats"),
    getLeaderboard: () => apiRequest<LeaderboardEntry[]>("/api/affiliate/leaderboard"),
    checkCode: (code: string) => apiRequest<{ available: boolean }>(`/api/affiliate/check-code/${code}`),
    updateCode: (code: string) => apiRequest<void>("/api/affiliate/update-code", {
        method: "POST",
        body: JSON.stringify({ code }),
    }),
};

export const callsApi = {
    getServices: () => apiRequest<any[]>("/api/calls/services"),
    createService: (data: any) => apiRequest<any>("/api/calls/services", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    updateService: (id: number, data: any) => apiRequest<any>(`/api/calls/services/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    }),
    deleteService: (id: number) => apiRequest<void>(`/api/calls/services/${id}`, { method: "DELETE" }),
    getSlots: (serviceId: number) => apiRequest<any[]>(`/api/calls/services/${serviceId}/slots`),
    toggleSlot: (serviceId: number, date: string, hour: number, available: boolean) =>
        apiRequest<any>(`/api/calls/services/${serviceId}/slots/toggle`, {
            method: "POST",
            body: JSON.stringify({ date, hour, available }),
        }),
    getBookings: () => apiRequest<any[]>("/api/calls/bookings"),
};

export const legalApi = {
    getStatus: () => apiRequest<LegalStatus>("/api/legal/status"),
    submitInfo: (data: LegalInfo) => apiRequest<void>("/api/legal/info", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    requestSignature: () => apiRequest<{ message: string }>("/api/legal/request-signature", {
        method: "POST",
    }),
    verifySignature: (otp: string) => apiRequest<{ hash: string; pdf_url: string }>("/api/legal/verify-signature", {
        method: "POST",
        body: JSON.stringify({ otp }),
    }),
    getPreviewUrl: () => `${API_URL}/api/legal/contract/preview`,
    getDownloadUrl: () => `${API_URL}/api/legal/contract/download`,
};
