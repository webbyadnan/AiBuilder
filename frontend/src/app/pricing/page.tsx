import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Zap } from 'lucide-react';

const plans = [
    {
        name: 'Basic',
        price: '$5',
        credits: '100 credits',
        description: 'Start Now, scale as you grow.',
        features: ['Upto 20 Creations', 'Limited Revisions', 'Basic AI Models', 'Email support', 'Basic analytics'],
        highlight: false,
    },
    {
        name: 'Pro',
        price: '$19',
        credits: '400 credits',
        description: 'Add credits to create more projects',
        features: ['Upto 80 Creations', 'Extended Revisions', 'Advanced AI Models', 'Priority email support', 'Advanced analytics'],
        highlight: true,
    },
    {
        name: 'Enterprise',
        price: '$49',
        credits: '1000 credits',
        description: 'Add credits to create more projects',
        features: ['Upto 200 Creations', 'Increased Revisions', 'Advanced AI Models', 'Email + chat support', 'Advanced analytics'],
        highlight: false,
    },
];

export default function PricingPage() {
    return (
        <div style={{ minHeight: '100vh' }}>
            <Navbar />
            <div className="hero-glow" style={{ padding: '80px 24px', textAlign: 'center' }}>
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16 }}>Choose Your Plan</h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto 64px', lineHeight: 1.7 }}>
                    Start for free and scale up as you grow. Find the perfect plan for your content creation needs.
                </p>

                <div style={{ display: 'flex', gap: 24, justifyContent: 'center', maxWidth: 960, margin: '0 auto', flexWrap: 'wrap' }}>
                    {plans.map((plan) => (
                        <div key={plan.name} className="glass-card" style={{
                            flex: '1 1 260px', maxWidth: 300, padding: 36, textAlign: 'left',
                            borderColor: plan.highlight ? 'rgba(124,58,237,0.5)' : undefined,
                            boxShadow: plan.highlight ? '0 0 40px rgba(109,40,217,0.25)' : undefined,
                            transform: plan.highlight ? 'scale(1.02)' : undefined,
                        }}>
                            <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 6 }}>{plan.name}</h2>
                            <div style={{ marginBottom: 12 }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>{plan.price}</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}> / {plan.credits}</span>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', marginBottom: 28 }}>{plan.description}</p>
                            <ul style={{ listStyle: 'none', marginBottom: 32 }}>
                                {plan.features.map((f) => (
                                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>
                                        <Check size={16} color="#4ade80" strokeWidth={3} /> {f}
                                    </li>
                                ))}
                            </ul>
                            <button className={plan.highlight ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                                {plan.highlight ? <><Zap size={16} /> Buy Now</> : 'Buy Now'}
                            </button>
                        </div>
                    ))}
                </div>

                <p style={{ marginTop: 48, color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem' }}>
                    Project <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Creation / Revision</strong> consume{' '}
                    <strong style={{ color: '#c4b5fd' }}>5 credits</strong>. You can purchase more credits to create more projects.
                </p>
            </div>
            <Footer />
        </div>
    );
}
