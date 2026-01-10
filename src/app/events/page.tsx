import Link from "next/link";


const events = [
    {
        id: 1,
        title: "Capture The Flag",
        description: "Test your skills in our flagship 24-hour CTF competition.",
        date: "March 15, 2025",
        type: "Technical",
    },
    {
        id: 2,
        title: "Hack-a-thon",
        description: "Build innovative security solutions in this overnight marathon.",
        date: "March 16, 2025",
        type: "Technical",
    },
    {
        id: 3,
        title: "Paper Presentation",
        description: "Present your research on the latest trends in Cyber Security.",
        date: "March 15, 2025",
        type: "Academic",
    },
];

export default function EventsPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-primary mb-8 glitch-text">EVENTS</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <div key={event.id} className="bg-card border border-primary/20 p-6 rounded-lg hover:border-primary transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-primary text-sm font-mono">{event.type}</span>
                            <span className="text-gray-400 text-xs">{event.date}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{event.title}</h2>
                        <p className="text-gray-400 text-sm leading-relaxed">{event.description}</p>
                        <div className="mt-6">
                            <span className="inline-block px-4 py-2 bg-primary/10 text-primary text-sm font-bold border border-primary/20 rounded hover:bg-primary hover:text-black transition-all cursor-pointer">Register</span>
                        </div>
                    </div>
                ))}
            </div>


        </div>
    );
}
