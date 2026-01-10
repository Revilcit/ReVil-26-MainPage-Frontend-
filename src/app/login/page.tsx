"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { email, password } = formData;

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token
            localStorage.setItem('token', data.token);
            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-32 flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md bg-black/50 backdrop-blur-md border border-primary/20 p-8 relative overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.1)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>

                <h1 className="text-3xl font-bold text-white mb-2 text-center font-orbitron tracking-widest">ACCESS REVIL</h1>
                <p className="text-gray-400 text-center mb-8 text-sm uppercase tracking-wider">Secure Protocol Login</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 text-sm mb-6 text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Placeholder for Google Auth if needed later */}
                    {/* <button className="w-full py-3 bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                        <div className="w-5 h-5 bg-red-500 rounded-full"></div>
                        Continue with Google
                    </button> */}

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div>
                            <label className="block text-primary text-xs uppercase tracking-widest mb-2">Identifier</label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                required
                                placeholder="ENTER EMAIL"
                                className="w-full bg-black/50 border border-gray-800 p-3 text-white focus:border-primary outline-none transition-colors placeholder:text-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-primary text-xs uppercase tracking-widest mb-2">Cipher</label>
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                required
                                placeholder="ENTER PASSWORD"
                                className="w-full bg-black/50 border border-gray-800 p-3 text-white focus:border-primary outline-none transition-colors placeholder:text-gray-700"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-black font-bold hover:bg-white transition-all duration-300 uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'AUTHENTICATING...' : 'INITIATE SESSION'}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-500 mt-6">
                        New to the system? <Link href="/register" className="text-primary hover:text-white transition-colors cursor-pointer">ESTABLISH IDENTITY</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
