import {
    AuthResponse, SummaryData, Channel, Withdrawal, SupportTicket,
    TicketDetailsResponse, ConfigItem, AnalyticsData, Promotion, Payment,
    LegalInfo, LegalStatus, UserAdmin
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    getSummary: () => apiRequest<SummaryData>("/owner/dashboard/summary"),
    getChannels: () => apiRequest<Channel[]>("/owner/channels"),
    createChannel: (title: string) => apiRequest<Channel>("/owner/channels", {
        method: "POST",
        body: JSON.stringify({ title }),
    }),
    deleteChannel: (id: number, confirm: boolean = false) => apiRequest<void>(`/owner/channels/${id}${confirm ? '?confirm=true' : ''}`, { method: "DELETE" }),
    getDeleteChannelCost: (id: number) => apiRequest<any>(`/owner/channels/${id}/delete-cost`),
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
    updatePassword: (data: any) => apiRequest<void>("/owner/password", {
        method: "PUT",
        body: JSON.stringify(data),
    }),
    getPromotions: (channelId: number) => apiRequest<Promotion[]>(`/owner/channels/${channelId}/promotions`),
    createPromotion: (channelId: number, data: any) => apiRequest<Promotion>(`/owner/channels/${channelId}/promotions`, {
        method: "POST",
        body: JSON.stringify(data),
    }),
    deletePromotion: (promoId: number) => apiRequest<void>(`/owner/promotions/${promoId}`, {
        method: "DELETE",
    }),
    getAnalytics: () => apiRequest<AnalyticsData>("/owner/analytics"),
    getProfile: () => apiRequest<any>("/owner/profile"),
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
        console.log("LOGIN REQUEST:", { url: `${API_URL}/token`, username: data.email });
        return fetch(`${API_URL}/token`, {
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
        console.log("REGISTER REQUEST:", { url: `${API_URL}/register`, data });
        return apiRequest<void>("/register", {
            method: "POST",
            body: JSON.stringify({
                email: data.email,
                password: data.password,
                full_name: data.fullName,
                referral_code: data.referral_code
            }),
        });
    },
};

export const usersApi = ownerApi;
export const walletApi = ownerApi;
export const channelApi = ownerApi;
export const supportApi = ownerApi;

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
    getPayments: () => apiRequest<Payment[]>("/admin/payments/pending"),
    verifyPayment: (id: number) => apiRequest<Payment>(`/admin/payments/${id}/verify-crypto`, {
        method: "POST",
    }),
    getUsers: () => apiRequest<UserAdmin[]>("/admin/users"),
    getTaxSummary: (year?: number) => apiRequest<any>(`/admin/tax/summary${year ? `?year=${year}` : ''}`),
    getExpenses: (year?: number) => apiRequest<any[]>(`/admin/expenses${year ? `?year=${year}` : ''}`),
    createExpense: (data: any) => apiRequest<any>(`/admin/expenses`, { method: "POST", body: JSON.stringify(data) }),
    deleteExpense: (id: number) => apiRequest<void>(`/admin/expenses/${id}`, { method: "DELETE" }),
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
