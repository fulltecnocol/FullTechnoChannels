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
    plans?: Plan[];
    logo_url?: string;
    subscriber_count?: number;
    monthly_price?: number;
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
    user_email?: string;
    transaction_hash?: string;
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
    request_date?: string;
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
    legal_verification_status: string;
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

export interface LegalInfo {
    has_legal?: boolean;
    person_type: 'natural' | 'juridica';
    full_legal_name?: string;
    id_type?: string;
    id_number?: string;
    business_name?: string;
    nit?: string;
    legal_rep_name?: string;
    legal_rep_id?: string;
    address?: string;
    city?: string;
    department?: string;
    phone?: string;
    bank_name?: string;
    account_type?: string;
    account_number?: string;
    account_holder_name?: string;
    rut_url?: string;
    bank_cert_url?: string;
    chamber_commerce_url?: string;
    contract_pdf_url?: string;
    signed_at?: string;
}

export interface LegalStatus {
    status: 'unverified' | 'pending' | 'verified';
    blockchain_hash?: string;
    signed_at?: string;
}

export interface UserAdmin {
    id: number;
    full_name: string;
    email: string;
    is_admin: boolean;
    is_owner: boolean;
    legal_verification_status: string;
    created_at: string;
}

export interface RegisterData {
    email: string;
    password: string;
    fullName: string;
    referral_code?: string;
    registration_token?: string;
}

export interface PasswordUpdateData {
    old_password: string;
    new_password: string;
    confirm_password: string;
}

export interface PromotionCreateData {
    code: string;
    promo_type: 'discount' | 'trial';
    value: number;
    max_uses?: number | null;
}

export interface PlanCreateData {
    name: string;
    description: string;
    price: number;
    duration_days: number;
}

export interface PlanUpdateData {
    name?: string;
    description?: string;
    price?: number;
    duration_days?: number;
    is_active?: boolean;
}

export interface ExpenseCreateData {
    description: string;
    amount: number;
    category: string;
    date: string;
}

export interface Expense {
    id: number;
    description: string;
    amount: number;
    category: string;
    date: string;
}

export interface TaxSummary {
    gross_revenue: number;
    total_expenses: number;
    net_income: number;
}

export interface SupportTicketItem {
    id: number;
    subject: string;
    status: 'open' | 'closed' | 'pending';
    updated_at: string;
}

// --- Affiliate System Types ---

export interface AffiliateNode {
    id: number;
    name: string;
    level: number;
    avatar_url?: string;
    total_referrals: number;
    join_date?: string;
    children: AffiliateNode[];
}

export interface AffiliateNetworkResponse {
    user_id: number;
    root_name: string;
    children: AffiliateNode[];
}

export interface AffiliateStats {
    total_earnings: number;
    earnings_by_level: { level: number; amount: number }[];
    recent_history: {
        id: number;
        amount: number;
        level: number;
        date: string;
        source_user: string;
    }[];
    direct_referrals: number;
    referral_code: string;
}

export interface AdminAffiliateStats {
    total_commissions_paid: number;
    active_recruiters: number;
    earnings_by_level: { level: number; amount: number }[];
}

export interface AffiliateLedgerEntry {
    id: number;
    affiliate_name: string;
    affiliate_id: number;
    source_user: string;
    amount: number;
    level: number;
    created_at: string;
    payment_id: number;
}
