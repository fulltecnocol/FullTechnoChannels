import {
    AuthResponse, SummaryData, Channel, Plan, Withdrawal, SupportTicket,
    TicketDetailsResponse, ConfigItem, AnalyticsData, Promotion, Payment,
    LegalInfo, LegalStatus, UserAdmin, RegisterData, PasswordUpdateData,
    PromotionCreateData, PlanCreateData, PlanUpdateData, ExpenseCreateData, Expense, TaxSummary,
    AdminAffiliateStats, AffiliateLedgerEntry, AffiliateNetworkResponse, LeaderboardEntry,
    AffiliateRank, RankCreate
} from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiRequest<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        next: { revalidate: 60 },
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

export async function apiDownload(endpoint: string, filename: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    const headers = {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${API_URL}${endpoint}`, { headers });

    if (!response.ok) {
        throw new Error("Error descargando archivo");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

export const authApi = {
    login: (data: { email: string; password: string }): Promise<AuthResponse> => {
        // FastAPI OAuth2PasswordRequestForm expects form data
        const formData = new URLSearchParams();
        formData.append("username", data.email);
        formData.append("password", data.password);

        return fetch(`${API_URL}/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        }).then(async (res) => {
            if (!res.ok) throw new Error("Credenciales inválidas");
            return res.json();
        });
    },
    register: (data: RegisterData) => apiRequest<void>("/register", {
        method: "POST",
        body: JSON.stringify({
            email: data.email,
            password: data.password,
            full_name: data.fullName,
            referral_code: data.referral_code,
            registration_token: data.registration_token
        }),
    }),
    googleAuth: (credential: string, referralCode?: string, registrationToken?: string) => apiRequest<AuthResponse>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential, referral_code: referralCode, registration_token: registrationToken }),
    }),
    magicLogin: (token: string) => apiRequest<AuthResponse>(`/auth/magic-login?token=${token}`, {
        method: "POST",
    }),
};

export const publicApi = {
    getConfig: () => apiRequest<Record<string, number>>("/public/config"),
};

export const ownerApi = {
    getSummary: () => apiRequest<SummaryData>("/owner/dashboard/summary"),
    getChannels: () => apiRequest<Channel[]>("/owner/channels"),
    createChannel: (title: string) => apiRequest<Channel>("/owner/channels", {
        method: "POST",
        body: JSON.stringify({ title }),
    }),
    deleteChannel: (channelId: number, confirm: boolean = false) => apiRequest<void>(`/owner/channels/${channelId}${confirm ? '?confirm=true' : ''}`, {
        method: "DELETE",
    }),
    getDeleteChannelCost: (channelId: number) => apiRequest<{
        active_subscribers: number;
        refund_amount: number;
        penalty_amount: number;
        total_cost: number;
        can_afford: boolean;
    }>(`/owner/channels/${channelId}/delete-cost`),
    getWithdrawals: () => apiRequest<Withdrawal[]>("/owner/withdrawals"),
    requestWithdrawal: (data: { amount: number; method: string; details: string }) => apiRequest<Withdrawal>("/owner/withdrawals", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    getTickets: () => apiRequest<SupportTicket[]>("/owner/tickets"),
    createTicket: (data: { subject: string; content: string }) => apiRequest<SupportTicket>("/owner/tickets", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    getTicketDetails: (id: number) => apiRequest<TicketDetailsResponse>(`/owner/tickets/${id}`),
    replyTicket: (id: number, content: string) => apiRequest<void>(`/owner/tickets/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ content }),
    }),
    updateBranding: (channelId: number, data: { welcome_message: string; expiration_message: string }) => apiRequest<Channel>(`/owner/channels/${channelId}/branding`, {
        method: "POST",
        body: JSON.stringify(data),
    }),
    updateProfile: (data: { full_name: string; avatar_url: string }) => apiRequest<void>("/owner/profile", {
        method: "PUT",
        body: JSON.stringify(data),
    }),
    updatePassword: (data: PasswordUpdateData) => apiRequest<void>("/owner/password", {
        method: "PUT",
        body: JSON.stringify(data),
    }),
    getPromotions: (channelId: number) => apiRequest<Promotion[]>(`/owner/channels/${channelId}/promotions`),
    createPromotion: (channelId: number, data: PromotionCreateData) => apiRequest<Promotion>(`/owner/channels/${channelId}/promotions`, {
        method: "POST",
        body: JSON.stringify(data),
    }),
    deletePromotion: (promoId: number) => apiRequest<void>(`/owner/promotions/${promoId}`, {
        method: "DELETE",
    }),
    getAnalytics: () => apiRequest<AnalyticsData>("/owner/analytics"),
    getPlans: (channelId: number) => apiRequest<Plan[]>(`/owner/channels/${channelId}/plans`),
    createPlan: (channelId: number, data: PlanCreateData) => apiRequest<Plan>(`/owner/channels/${channelId}/plans`, {
        method: "POST",
        body: JSON.stringify(data),
    }),
    updatePlan: (planId: number, data: PlanUpdateData) => apiRequest<Plan>(`/owner/plans/${planId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    }),
    deletePlan: (planId: number) => apiRequest<{ status?: string }>(`/owner/plans/${planId}`, {
        method: "DELETE",
    }),
};

export const affiliateApi = {
    checkCode: (code: string) => apiRequest<{ available: boolean }>(`/affiliate/check-code/${code}`),
    updateCode: (code: string) => apiRequest<{ status: string; referral_code: string }>("/affiliate/update-code", {
        method: "POST",
        body: JSON.stringify({ code }),
    }),
    getLeaderboard: (): Promise<LeaderboardEntry[]> => apiRequest<LeaderboardEntry[]>("/affiliate/leaderboard"),
};

export const adminApi = {
    getConfig: () => apiRequest<ConfigItem[]>("/admin/config"),
    updateConfig: (key: string, value: number) => apiRequest<ConfigItem>("/admin/config", {
        method: "POST",
        body: JSON.stringify({ key, value }),
    }),
    getWithdrawals: () => apiRequest<Withdrawal[]>("/admin/withdrawals"),
    processWithdrawal: (id: number, status: string) => apiRequest<Withdrawal>(`/admin/withdrawals/${id}/process`, {
        method: "POST",
        body: JSON.stringify({ status }),
    }),
    getTickets: () => apiRequest<SupportTicket[]>("/admin/tickets"),
    getTicketDetails: (id: number) => apiRequest<TicketDetailsResponse>(`/admin/tickets/${id}`),
    replyTicket: (id: number, content: string) => apiRequest<void>(`/admin/tickets/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ content }),
    }),
    getPendingPayments: () => apiRequest<Payment[]>("/admin/payments/pending"),
    verifyCryptoPayment: (id: number) => apiRequest<Payment>(`/admin/payments/${id}/verify-crypto`, {
        method: "POST",
    }),
    getUsers: () => apiRequest<UserAdmin[]>("/admin/users"),
    deleteUser: (id: number) => apiRequest<void>(`/admin/users/${id}`, {
        method: "DELETE",
    }),
    getUserLegalInfo: (id: number) => apiRequest<LegalInfo>(`/admin/users/${id}/legal`),
    getTaxSummary: (year?: number) => apiRequest<TaxSummary>(`/admin/tax/summary${year ? `?year=${year}` : ""}`),
    getExpenses: (year?: number) => apiRequest<Expense[]>(`/admin/expenses${year ? `?year=${year}` : ""}`),
    createExpense: (data: ExpenseCreateData) => apiRequest("/admin/expenses", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    deleteExpense: (id: number) => apiRequest(`/admin/expenses/${id}`, {
        method: "DELETE",
    }),
    getAffiliateStats: () => apiRequest<AdminAffiliateStats>("/admin/affiliates/stats"),
    getAffiliateLedger: (limit: number = 50, offset: number = 0) => apiRequest<AffiliateLedgerEntry[]>(`/admin/affiliates/ledger?limit=${limit}&offset=${offset}`),
    getAffiliateTree: (userId: number) => apiRequest<AffiliateNetworkResponse>(`/admin/affiliates/tree/${userId}`),

    // Ranks
    getAffiliateRanks: () => apiRequest<AffiliateRank[]>("/admin/ranks"),
    createAffiliateRank: (data: RankCreate) => apiRequest<AffiliateRank>("/admin/ranks", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    deleteAffiliateRank: (id: number) => apiRequest<void>(`/admin/ranks/${id}`, {
        method: "DELETE",
    }),

    // User Upline
    updateUserUpline: (userId: number, referrerId: number) => apiRequest<{ ok: boolean; new_referrer: string }>(`/admin/users/${userId}/uplink`, {
        method: "PATCH",
        body: JSON.stringify({ referrer_id: referrerId }),
    }),
    downloadContract: (userId: number) => apiDownload(`/admin/users/${userId}/contract`, `contract_${userId}.pdf`),
};

export const legalApi = {
    getStatus: () => apiRequest<LegalStatus>("/legal/status"),
    submitInfo: (data: LegalInfo) => apiRequest<void>("/legal/info", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    requestSignature: () => apiRequest<{ message: string }>("/legal/request-signature", {
        method: "POST",
    }),
    verifySignature: (otp: string) => apiRequest<{ hash: string; pdf_url: string }>("/legal/verify-signature", {
        method: "POST",
        body: JSON.stringify({ otp }),
    }),
    getPreviewUrl: () => `${API_URL}/legal/contract/preview`,
    getDownloadUrl: () => `${API_URL}/legal/contract/download`,
};
