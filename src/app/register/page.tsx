"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        college: '',
        department: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { name, email, password, confirmPassword, phoneNumber, college, department } = formData;

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password, phoneNumber, college, department })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed');
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
            <div className="w-full max-w-2xl bg-black/50 backdrop-blur-md border border-primary/20 p-8 relative overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.1)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>

                <h1 className="text-3xl font-bold text-white mb-2 text-center font-orbitron tracking-widest">JOIN THE REVOLUTION</h1>
                <p className="text-gray-400 text-center mb-8 text-sm uppercase tracking-wider">Create your REVIL Identity</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 text-sm mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-primary text-xs uppercase tracking-widest mb-2">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={name}
                                onChange={onChange}
                                required
                                placeholder="ENTER NAME"
                                className="w-full bg-black/50 border border-gray-800 p-3 text-white focus:border-primary outline-none transition-colors placeholder:text-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-primary text-xs uppercase tracking-widest mb-2">Phone Number</label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={phoneNumber}
                                onChange={onChange}
                                required
                                placeholder="ENTER PHONE"
                                className="w-full bg-black/50 border border-gray-800 p-3 text-white focus:border-primary outline-none transition-colors placeholder:text-gray-700"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-primary text-xs uppercase tracking-widest mb-2">Email Address</label>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-primary text-xs uppercase tracking-widest mb-2">College / Institution</label>
                            <input
                                type="text"
                                name="college"
                                value={college}
                                onChange={onChange}
                                required
                                placeholder="ENTER COLLEGE"
                                className="w-full bg-black/50 border border-gray-800 p-3 text-white focus:border-primary outline-none transition-colors placeholder:text-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-primary text-xs uppercase tracking-widest mb-2">Department</label>
                            <input
                                type="text"
                                name="department"
                                value={department}
                                onChange={onChange}
                                required
                                placeholder="ENTER DEPT"
                                className="w-full bg-black/50 border border-gray-800 p-3 text-white focus:border-primary outline-none transition-colors placeholder:text-gray-700"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-primary text-xs uppercase tracking-widest mb-2">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                required
                                placeholder="CREATE PASSWORD"
                                className="w-full bg-black/50 border border-gray-800 p-3 text-white focus:border-primary outline-none transition-colors placeholder:text-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-primary text-xs uppercase tracking-widest mb-2">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={onChange}
                                required
                                placeholder="CONFIRM PASSWORD"
                                className="w-full bg-black/50 border border-gray-800 p-3 text-white focus:border-primary outline-none transition-colors placeholder:text-gray-700"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-black font-bold hover:bg-white transition-all duration-300 uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? 'PROCESSING...' : 'ESTABLISH IDENTITY'}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-500 mt-6">
                    Already have an identity? <Link href="/login" className="text-primary hover:text-white transition-colors cursor-pointer">INITIATE SESSION</Link>
                </p>
            </div>
        </div>
    );
}
