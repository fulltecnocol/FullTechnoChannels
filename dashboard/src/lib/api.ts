const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
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

export const authApi = {
    login: (data: any) => {
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
    register: (data: any) => apiRequest("/register", {
        method: "POST",
        body: JSON.stringify({
            email: data.email,
            password: data.password,
            full_name: data.fullName,
            referral_code: data.referral_code
        }),
    }),
};

export const ownerApi = {
    getSummary: () => apiRequest("/owner/dashboard/summary"),
    getChannels: () => apiRequest("/owner/channels"),
    createChannel: (title: string) => apiRequest("/owner/channels", {
        method: "POST",
        body: JSON.stringify({ title }),
    }),
    getWithdrawals: () => apiRequest("/owner/withdrawals"),
    requestWithdrawal: (data: any) => apiRequest("/owner/withdrawals", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    getTickets: () => apiRequest("/owner/tickets"),
    createTicket: (data: any) => apiRequest("/owner/tickets", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    getTicketDetails: (id: number) => apiRequest(`/owner/tickets/${id}`),
    replyTicket: (id: number, content: string) => apiRequest(`/owner/tickets/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ content }),
    }),
    updateBranding: (channelId: number, data: any) => apiRequest(`/owner/channels/${channelId}/branding`, {
        method: "POST",
        body: JSON.stringify(data),
    }),
    updateProfile: (data: any) => apiRequest("/owner/profile", {
        method: "PUT",
        body: JSON.stringify(data),
    }),
    updatePassword: (data: any) => apiRequest("/owner/password", {
        method: "PUT",
        body: JSON.stringify(data),
    }),
    getPromotions: (channelId: number) => apiRequest(`/owner/channels/${channelId}/promotions`),
    createPromotion: (channelId: number, data: any) => apiRequest(`/owner/channels/${channelId}/promotions`, {
        method: "POST",
        body: JSON.stringify(data),
    }),
    deletePromotion: (promoId: number) => apiRequest(`/owner/promotions/${promoId}`, {
        method: "DELETE",
    }),
    getAnalytics: () => apiRequest("/owner/analytics"),
};

export const adminApi = {
    getConfig: () => apiRequest("/admin/config"),
    updateConfig: (key: string, value: number) => apiRequest("/admin/config", {
        method: "POST",
        body: JSON.stringify({ key, value }),
    }),
    getWithdrawals: () => apiRequest("/admin/withdrawals"),
    processWithdrawal: (id: number, status: string) => apiRequest(`/admin/withdrawals/${id}/process`, {
        method: "POST",
        body: JSON.stringify({ status }),
    }),
    getTickets: () => apiRequest("/admin/tickets"),
    getTicketDetails: (id: number) => apiRequest(`/admin/tickets/${id}`),
    replyTicket: (id: number, content: string) => apiRequest(`/admin/tickets/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ content }),
    }),
    getPendingPayments: () => apiRequest("/admin/payments/pending"),
    verifyCryptoPayment: (id: number) => apiRequest(`/admin/payments/${id}/verify-crypto`, {
        method: "POST",
    }),
};
