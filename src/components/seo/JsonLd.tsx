import React from 'react';

export function JsonLd() {
    const organizationData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "FGate",
        "url": "https://full-techno-channels.web.app",
        "logo": "https://full-techno-channels.web.app/favicon.ico",
        "description": "Plataforma líder en automatización y monetización de canales de Telegram.",
        "sameAs": [
            "https://twitter.com/fulltechnohub",
            "https://github.com/fulltechnocol"
        ]
    };

    const productData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "FGate Admin Dashboard",
        "description": "Sistema de gestión de membresías y red de afiliados para Telegram.",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "All",
        "offers": {
            "@type": "Offer",
            "price": "0.00",
            "priceCurrency": "USD"
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }}
            />
        </>
    );
}
