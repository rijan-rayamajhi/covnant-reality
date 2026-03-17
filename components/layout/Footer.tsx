"use client";

import Link from "next/link";
import Image from "next/image";

export function Footer() {
    return (
        <footer className="bg-white border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/logo.png"
                                alt="Covnant Reality Logo"
                                width={180}
                                height={60}
                                className="h-14 w-auto object-contain"
                            />
                        </Link>
                        <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                            Your trusted destination to buy, rent, or sell premium properties.
                            Discover your dream home with us today.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">Quick Links</h3>
                        <ul className="space-y-3">
                            <li><Link href="/search?type=buy" className="text-sm text-text-secondary hover:text-primary transition-colors inline-block">Buy property</Link></li>
                            <li><Link href="/search?type=rent" className="text-sm text-text-secondary hover:text-primary transition-colors inline-block">Rent property</Link></li>
                            <li><Link href="/search?type=commercial" className="text-sm text-text-secondary hover:text-primary transition-colors inline-block">Commercial spaces</Link></li>
                            <li><Link href="/search?type=project" className="text-sm text-text-secondary hover:text-primary transition-colors inline-block">New Projects</Link></li>
                            <li><Link href="/search" className="text-sm text-text-secondary hover:text-primary transition-colors inline-block">Find Agents</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">Support</h3>
                        <ul className="space-y-3">
                            <li><Link href="/about" className="text-sm text-text-secondary hover:text-primary transition-colors inline-block">About Us</Link></li>
                            <li><Link href="/contact" className="text-sm text-text-secondary hover:text-primary transition-colors inline-block">Contact Us</Link></li>
                            <li><Link href="/faq" className="text-sm text-text-secondary hover:text-primary transition-colors inline-block">FAQs</Link></li>
                            <li><Link href="/privacy" className="text-sm text-text-secondary hover:text-primary transition-colors inline-block">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-sm text-text-secondary hover:text-primary transition-colors inline-block">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                    <p className="text-sm text-text-muted">
                        © {new Date().getFullYear()} Covnant Reality India PVT LTD. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="text-sm text-text-muted font-medium">
                            Maintained by <a href="https://spotwebs.in/" target="_blank" rel="noopener noreferrer" className="font-bold text-[#d18a4a] hover:text-[#b4763e] transition-colors">SPOTWEBS</a>
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

