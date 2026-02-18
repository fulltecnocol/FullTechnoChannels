"use client";

import React, { useState, useEffect } from "react";
import {
    ShieldCheck, FileText, Send, CheckCircle2,
    ExternalLink, Download, AlertTriangle, Loader2,
    User, MapPin, Phone, Building2, Fingerprint
} from "lucide-react";
import { legalApi } from "@/lib/api";
import { LegalInfo, LegalStatus } from "@/lib/types";

export function LegalSignature() {
    const [legalStatus, setLegalStatus] = useState<LegalStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [personType, setPersonType] = useState<'natural' | 'juridica'>('natural');
    const [submitting, setSubmitting] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const status = await legalApi.getStatus();
            setLegalStatus(status);
        } catch (err) {
            console.error("Error fetching legal status:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitInfo = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const info: LegalInfo = {
            person_type: personType,
            full_name: formData.get("full_name") as string,
            document_id: formData.get("document_id") as string,
            address: formData.get("address") as string,
            phone: formData.get("phone") as string,
        };

        if (personType === 'juridica') {
            info.company_name = formData.get("company_name") as string;
            info.tax_id = formData.get("tax_id") as string;
            info.legal_representative = formData.get("legal_representative") as string;
        }

        try {
            setSubmitting(true);
            await legalApi.submitInfo(info);
            fetchStatus();
            alert("Información legal guardada. Ahora puedes revisar el contrato.");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestSignature = async () => {
        try {
            setSubmitting(true);
            const resp = await legalApi.requestSignature();
            setOtpSent(true);
            alert(resp.message);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifySignature = async () => {
        if (!otp) return;
        try {
            setVerifying(true);
            const resp = await legalApi.verifySignature(otp);
            fetchStatus();
            alert("¡Contrato firmado exitosamente en Blockchain!");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setVerifying(false);
        }
    };

    if (loading) return (
        <div className="p-20 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
            <p className="text-muted font-bold">Verificando estado legal...</p>
        </div>
    );

    if (legalStatus?.status === 'verified') {
        return (
            <div className="space-y-8 animate-fade-in p-8 rounded-3xl border border-primary/20 bg-primary/5 backdrop-blur-sm">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-primary text-primary-foreground flex items-center justify-center rounded-2xl shadow-xl shadow-primary/20">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>

                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Identidad Verificada</h2>
                        <p className="text-primary font-bold">Tu contrato ha sido sellado en la Blockchain de Polygon.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-background border border-surface-border space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Hash de Transacción</p>
                        <code className="block p-3 bg-surface text-primary text-xs font-mono break-all border border-primary/20">
                            {legalStatus.blockchain_hash}
                        </code>
                        <a
                            href={`https://amoy.polygonscan.com/tx/${legalStatus.blockchain_hash}`}
                            target="_blank"
                            className="flex items-center gap-2 text-xs font-black text-primary hover:underline"
                        >
                            Ver en PolygonScan <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>

                    <div className="p-6 bg-background border border-surface-border space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Documentos Legales</p>
                        <div className="flex flex-col gap-3">
                            <a
                                href={legalApi.getDownloadUrl()}
                                className="flex items-center justify-between p-4 bg-primary text-black font-black uppercase tracking-tighter text-xs hover:scale-[1.02] transition-all"
                            >
                                Descargar Contrato Firmado <Download className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in max-w-4xl mx-auto">
            <div className="text-left space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-primary" /> Verificación de Identidad
                </h2>
                <p className="text-muted font-medium">Para cumplir con regulaciones internacionales y activar tus canales, debes firmar digitalmente el contrato de mandato.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                <div className="md:col-span-12">
                    <div className="flex border-b border-surface-border mb-8">
                        <button
                            onClick={() => setPersonType('natural')}
                            className={`px-8 py-4 font-black uppercase tracking-widest text-xs transition-all border-b-2 ${personType === 'natural' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                        >
                            Persona Natural
                        </button>
                        <button
                            onClick={() => setPersonType('juridica')}
                            className={`px-8 py-4 font-black uppercase tracking-widest text-xs transition-all border-b-2 ${personType === 'juridica' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                        >
                            Persona Jurídica
                        </button>
                    </div>

                    <form onSubmit={handleSubmitInfo} className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 premium-card bg-surface/30 backdrop-blur-md">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-2 px-1">
                                <User className="w-3 h-3" /> Nombre Completo
                            </label>
                            <input required name="full_name" type="text" className="w-full p-4 bg-background border border-surface-border rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm shadow-inner" />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-2 px-1">
                                <Fingerprint className="w-3 h-3" /> Documento Identidad
                            </label>
                            <input required name="document_id" type="text" className="w-full p-4 bg-background border border-surface-border rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm shadow-inner" />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-2 px-1">
                                <MapPin className="w-3 h-3" /> Dirección de Residencia
                            </label>
                            <input required name="address" type="text" className="w-full p-4 bg-background border border-surface-border rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm shadow-inner" />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-2 px-1">
                                <Phone className="w-3 h-3" /> Teléfono de Contacto
                            </label>
                            <input required name="phone" type="text" className="w-full p-4 bg-background border border-surface-border rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm shadow-inner" />
                        </div>

                        {personType === 'juridica' && (
                            <>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-2 px-1">
                                        <Building2 className="w-3 h-3" /> Nombre de la Empresa
                                    </label>
                                    <input required name="company_name" type="text" className="w-full p-4 bg-background border border-surface-border rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm shadow-inner" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-2 px-1">
                                        <Fingerprint className="w-3 h-3" /> NIT / Tax ID
                                    </label>
                                    <input required name="tax_id" type="text" className="w-full p-4 bg-background border border-surface-border rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm shadow-inner" />
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-2 px-1">
                                        <ShieldCheck className="w-3 h-3" /> Representante Legal
                                    </label>
                                    <input required name="legal_representative" type="text" className="w-full p-4 bg-background border border-surface-border rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm shadow-inner" />
                                </div>
                            </>
                        )}

                        <div className="md:col-span-2 pt-6">
                            <button
                                disabled={submitting}
                                className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                            >
                                {submitting ? "Guardando..." : "Guardar & Continuar a la Firma"}
                            </button>
                        </div>
                    </form>

                </div>
            </div>

            {legalStatus?.status === 'pending' && (
                <div className="pt-10 border-t-2 border-primary/20 space-y-8">
                    <div className="p-10 border-2 border-primary bg-primary/5 space-y-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="space-y-2 text-center md:text-left">
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Siguiente Paso: Firma Digital</h3>
                                <p className="text-primary font-bold">Genera tu código OTP y firma en segundos.</p>
                            </div>
                            <div className="flex gap-4">
                                <a
                                    href={legalApi.getPreviewUrl()}
                                    target="_blank"
                                    className="flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary font-black uppercase tracking-tighter text-xs hover:bg-primary/10 transition-all"
                                >
                                    <FileText className="w-4 h-4" /> Previsualizar PDF
                                </a>
                                <button
                                    onClick={handleRequestSignature}
                                    disabled={submitting || otpSent}
                                    className="flex items-center gap-2 px-8 py-3 bg-primary text-black font-black uppercase tracking-tighter text-xs hover:scale-105 transition-all disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" /> Enviar Código OTP a Telegram
                                </button>
                            </div>
                        </div>

                        {otpSent && (
                            <div className="max-w-md mx-auto space-y-4 animate-fade-in">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary text-center block">Introduce el código enviado por @FTGateBot</label>
                                    <input
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="000000"
                                        className="w-full p-6 bg-background border-4 border-primary outline-none text-center text-4xl font-black tracking-[0.5em] text-primary"
                                    />
                                </div>
                                <button
                                    onClick={handleVerifySignature}
                                    disabled={verifying || !otp}
                                    className="w-full py-4 bg-primary text-black font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                    Confirmar Firma en Blockchain
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 p-6 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-sm">
                        <AlertTriangle className="w-6 h-6 shrink-0" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                            Advertencia: La firma digital tiene validez legal vinculante. Al firmar, aceptas los términos y condiciones del contrato de mandato de FGate.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
