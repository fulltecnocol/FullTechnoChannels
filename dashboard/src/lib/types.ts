export interface User {
    id: number;
    telegram_id?: number;
    username?: string;
    full_name?: string;
    email?: string;
    is_admin: boolean;
    is_owner: boolean;
    referral_code: string;
    referred_by_id?: number;
    balance: number;
    affiliate_balance: number;
    pending_balance: number;
    avatar_url?: string;
    created_at: string;
}

export interface Channel {
    id: number;
    owner_id: number;
    telegram_id?: number;
    title: string;
    invite_link?: string;
    validation_code: string;
    is_verified: boolean;
    welcome_message?: string;
    expiration_message?: string;
    created_at: string;
}

export interface Plan {
    id: number;
    channel_id: number;
    name: string;
    description: string;
    price: number;
    duration_days: number;
    stripe_price_id?: string;
    is_active: boolean;
}

export interface Subscription {
    id: number;
    user_id: number;
    plan_id: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
    is_trial: boolean;
}

export interface Payment {
    id: number;
    user_id: number;
    plan_id?: number;
    amount: number;
    currency: string;
    payment_method: string;
    provider_tx_id?: string;
    status: string;
    platform_amount: number;
    owner_amount: number;
    affiliate_amount: number;
    affiliate_id?: number;
    created_at: string;
}

export interface Withdrawal {
    id: number;
    owner_id: number;
    amount: number;
    fee_applied: number;
    status: string;
    method: string;
    details?: string;
    is_express: boolean;
    created_at: string;
    payout_id?: number;
}

export interface Promotion {
    id: number;
    channel_id: number;
    code: string;
    promo_type: 'discount' | 'trial';
    value: number;
    max_uses?: number;
    current_uses: number;
    is_active: boolean;
    created_at: string;
}

export interface SupportTicket {
    id: number;
    user_id: number;
    subject: string;
    status: 'open' | 'closed' | 'pending';
    priority: 'low' | 'normal' | 'high';
    created_at: string;
    updated_at: string;
}

export interface TicketMessage {
    id: number;
    ticket_id: number;
    sender_id: number;
    content: string;
    created_at: string;
}

export interface AnalyticsData {
    revenue_series: { date: string; value: number }[];
    subscriber_series: { date: string; value: number }[];
    mlm_series: { date: string; value: number }[];
}

export interface SummaryData {
    id: number;
    full_name: string;
    email: string;
    avatar_url?: string;
    active_subscribers: number;
    available_balance: number;
    affiliate_balance: number;
    active_channels: number;
    referral_code: string;
    affiliate_tier: string;
    referral_count: number;
    affiliate_next_tier_min?: number;
    is_admin: boolean;
    telegram_linked: boolean;
}

export interface ConfigItem {
    id: number;
    key: string;
    value: number;
    description?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface TicketDetailsResponse {
    ticket: SupportTicket;
    messages: TicketMessage[];
}
