"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    college: string;
    department: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchUser = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/auth/me', {
                    headers: {
                        'x-auth-token': token
                    }
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch user');
                }

                const data = await res.json();
                setUser(data);
            } catch (err) {
                console.error(err);
                localStorage.removeItem('token');
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-primary font-mono animate-pulse">
                INITIALIZING DASHBOARD PROTOCOLS...
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen pt-24 px-4 bg-black">
            <div className="container mx-auto max-w-6xl">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-primary/20 pb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white font-orbitron mb-2">COMMAND CENTER</h1>
                        <p className="text-gray-400 font-mono">WELCOME, <span className="text-primary">{user.name.toUpperCase()}</span></p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-4 md:mt-0 px-6 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors uppercase text-sm tracking-widest"
                    >
                        Termimate Session
                    </button>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* User Profile Card */}
                    <div className="col-span-1 bg-card/10 border border-white/10 p-6 rounded-lg backdrop-blur-sm">
                        <h2 className="text-xl font-bold text-white mb-6 border-l-4 border-primary pl-4">IDENTITY</h2>
                        <div className="space-y-4 font-mono text-sm">
                            <div>
                                <label className="block text-gray-500 text-xs">ROLE</label>
                                <div className="text-primary uppercase">{user.role.replace('_', ' ')}</div>
                            </div>
                            <div>
                                <label className="block text-gray-500 text-xs">EMAIL</label>
                                <div className="text-white">{user.email}</div>
                            </div>
                            <div>
                                <label className="block text-gray-500 text-xs">COLLEGE</label>
                                <div className="text-white">{user.college || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="block text-gray-500 text-xs">DEPARTMENT</label>
                                <div className="text-white">{user.department || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="col-span-1 md:col-span-2 space-y-8">

                        {/* Status Panel */}
                        <div className="bg-card/10 border border-white/10 p-6 rounded-lg backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-4">REGISTRATION STATUS</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/40 p-4 border border-primary/20">
                                    <div className="text-3xl font-bold text-white mb-1">0</div>
                                    <div className="text-xs text-gray-400 uppercase">Events Registered</div>
                                </div>
                                <div className="bg-black/40 p-4 border border-primary/20">
                                    <div className="text-3xl font-bold text-white mb-1">0</div>
                                    <div className="text-xs text-gray-400 uppercase">Workshops Registered</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-card/10 border border-white/10 p-6 rounded-lg backdrop-blur-sm">
                            <h2 className="text-xl font-bold text-white mb-4">ACTIONS</h2>
                            <div className="flex gap-4">
                                <button className="px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors" onClick={() => router.push('/events')}>
                                    Browse Events
                                </button>
                                <button className="px-6 py-3 border border-gray-600 text-gray-300 font-bold uppercase text-sm hover:border-primary hover:text-primary transition-colors" onClick={() => router.push('/workshops')}>
                                    Browse Workshops
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
