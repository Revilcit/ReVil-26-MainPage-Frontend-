"use client";
import { useState } from "react";

export default function ContactPage() {
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Message sent! (Simulation)");
    };

    return (
        <div className="container mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-primary mb-12 glitch-text">CONTACT US</h1>

            <div className="grid md:grid-cols-2 gap-16">
                {/* Contact Form */}
                <div className="bg-card/50 p-8 border border-primary/20">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-mono text-primary mb-2">NAME</label>
                            <input
                                type="text"
                                className="w-full bg-black/50 border border-gray-800 focus:border-primary text-white p-3 outline-none transition-colors"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-mono text-primary mb-2">EMAIL</label>
                            <input
                                type="email"
                                className="w-full bg-black/50 border border-gray-800 focus:border-primary text-white p-3 outline-none transition-colors"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-mono text-primary mb-2">MESSAGE</label>
                            <textarea
                                rows={4}
                                className="w-full bg-black/50 border border-gray-800 focus:border-primary text-white p-3 outline-none transition-colors"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="w-full py-4 bg-primary text-black font-bold hover:bg-white transition-colors">
                            TRANSMIT MESSAGE
                        </button>
                    </form>
                </div>

                {/* Map / Info */}
                <div className="space-y-8">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Location</h3>
                        <p className="text-gray-400">
                            Chennai Institute of Technology,<br />
                            Sarathy Nagar, Kundrathur,<br />
                            Chennai - 600069
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Direct Line</h3>
                        <p className="text-primary text-lg">+91 98765 43210</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
