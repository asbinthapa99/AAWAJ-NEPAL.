"use client"

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

export default function ClientNavbar() {
    const pathname = usePathname()

    // Hide the default top navbar on the landing page (custom floating navbar there)
    // and on all auth pages (full-screen split layout)
    if (pathname === '/' || pathname.startsWith('/auth')) {
        return null
    }

    return <Navbar />
}
