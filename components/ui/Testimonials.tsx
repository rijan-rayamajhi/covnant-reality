import { Star } from "lucide-react";
import Image from "next/image";

const testimonials = [
    {
        id: 1,
        name: "Rajesh Reddy",
        role: "Property Investor",
        image: "https://randomuser.me/api/portraits/men/32.jpg",
        rating: 5,
        text: "Finding authentic investment opportunities in Jubilee Hills used to be a hassle. This platform brought complete transparency to the market.",
    },
    {
        id: 2,
        name: "Sneha Goud",
        role: "First-time Buyer",
        image: "https://randomuser.me/api/portraits/women/44.jpg",
        rating: 5,
        text: "I found my dream 3BHK in Gachibowli with zero brokerage fees. The process was incredibly smooth and hassle-free from day one.",
    },
    {
        id: 3,
        name: "Kiran Kumar",
        role: "Real Estate Agent",
        image: "https://randomuser.me/api/portraits/men/22.jpg",
        rating: 4,
        text: "This platform has transformed how I connect with clients across Hitech City and Madhapur. Genuine leads and a fantastic user interface.",
    },
    {
        id: 4,
        name: "Lakshmi Narayana",
        role: "Seller",
        image: "https://randomuser.me/api/portraits/men/46.jpg",
        rating: 5,
        text: "Sold my villa in Manikonda within three weeks! The visibility this app provides to serious buyers is unmatched anywhere in Hyderabad.",
    },
    {
        id: 5,
        name: "Raja Shekhar",
        role: "Tenant",
        image: "https://randomuser.me/api/portraits/men/11.jpg",
        rating: 5,
        text: "Moving to Kondapur was stressful until I used this app. Verified listings meant I didn't have to deal with fake brokers at all.",
    },
    {
        id: 6,
        name: "Pooja Sharma",
        role: "NRI Investor",
        image: "https://randomuser.me/api/portraits/women/68.jpg",
        rating: 5,
        text: "Managing properties back in Kukatpally from the US is now incredibly easy. I trust their verified property details completely.",
    },
    {
        id: 7,
        name: "Venkatesh Rao",
        role: "Commercial Buyer",
        image: "https://randomuser.me/api/portraits/men/33.jpg",
        rating: 4,
        text: "Finding a prime office space in Banjara Hills is tough, but they had the best upscale commercial listings all in one place.",
    },
    {
        id: 8,
        name: "Bhavana Chary",
        role: "Home Buyer",
        image: "https://randomuser.me/api/portraits/women/24.jpg",
        rating: 5,
        text: "The local insights they provide for developing areas like Tellapur really helped me make an informed decision for my family.",
    },
    {
        id: 9,
        name: "Mohammed Ali",
        role: "Property Owner",
        image: "https://randomuser.me/api/portraits/men/62.jpg",
        rating: 5,
        text: "Renting out my apartments in Tolichowki has never been this efficient. The background checks for tenants give me immense peace of mind.",
    },
    {
        id: 10,
        name: "Divya Singh",
        role: "IT Professional",
        image: "https://randomuser.me/api/portraits/women/54.jpg",
        rating: 5,
        text: "As someone who just moved to Hyderabad, getting a nice flat near the Financial District without paying exorbitant brokerage was a blessing.",
    },
];

export function Testimonials() {
    return (
        <section className="py-12 lg:py-20 bg-[#FAFAFA] overflow-hidden">
            <style>{`
                @keyframes scroll-testimonials {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        /* 
                           Shift exactly half of the duplicated list.
                           We use calc to avoid relying on specific element widths, 
                           relying instead on the flex container being double the width 
                           and moving exactly halfway. 
                           However, with flex and gap, it's easier to animate a single container 
                           by exactly -50%. 
                        */
                        transform: translateX(calc(-50% - 12px));
                    }
                }
                .animate-marquee {
                    animation: scroll-testimonials 40s linear infinite;
                }
                .marquee-container:hover .animate-marquee {
                    animation-play-state: paused;
                }
            `}</style>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                        What Our Users Say
                    </h2>
                    <p className="text-base text-slate-500 max-w-2xl mx-auto">
                        Real stories from buyers, sellers, and agents who trust our platform.
                    </p>
                </div>
            </div>

            {/* Scrolling container */}
            <div className="marquee-container relative w-full overflow-hidden flex pb-6">
                
                {/* 
                    To make it scroll seamlessly infinite, we duplicate the list of testimonials 
                    so that when it reaches the end, the start is already visible. 
                    The animation moves the container.
                */}
                <div className="flex animate-marquee shrink-0 gap-6 px-3">
                    {/* First Map */}
                    {testimonials.map((testimonial) => (
                        <div
                            key={'first-' + testimonial.id}
                            className="w-[300px] sm:w-[350px] md:w-[400px] shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow duration-300"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-slate-50">
                                    <Image
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 leading-none mb-1 text-sm sm:text-base">
                                        {testimonial.name}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-500 leading-none">
                                        {testimonial.role}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < testimonial.rating
                                            ? "text-yellow-400 fill-yellow-400"
                                            : "text-gray-200 fill-gray-200"
                                            }`}
                                    />
                                ))}
                            </div>

                            <p className="text-gray-600 text-sm sm:text-base leading-relaxed flex-grow italic">
                                &ldquo;{testimonial.text}&rdquo;
                            </p>
                        </div>
                    ))}

                    {/* Duplicated Map to allow seamless looping */}
                    {testimonials.map((testimonial) => (
                        <div
                            key={'second-' + testimonial.id}
                            className="w-[300px] sm:w-[350px] md:w-[400px] shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow duration-300"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-slate-50">
                                    <Image
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 leading-none mb-1 text-sm sm:text-base">
                                        {testimonial.name}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-500 leading-none">
                                        {testimonial.role}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < testimonial.rating
                                            ? "text-yellow-400 fill-yellow-400"
                                            : "text-gray-200 fill-gray-200"
                                            }`}
                                    />
                                ))}
                            </div>

                            <p className="text-gray-600 text-sm sm:text-base leading-relaxed flex-grow italic">
                                &ldquo;{testimonial.text}&rdquo;
                            </p>
                        </div>
                    ))}
                </div>
                
                {/* Pointer events gradient fades for the edges */}
                <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#FAFAFA] to-transparent pointer-events-none"></div>
                <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#FAFAFA] to-transparent pointer-events-none"></div>
            </div>
        </section>
    );
}
