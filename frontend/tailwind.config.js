/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#4f46e5', // Indigo 600
                    hover: '#4338ca',   // Indigo 700
                    light: '#e0e7ff',   // Indigo 100
                },
                secondary: {
                    DEFAULT: '#64748b', // Slate 500
                    light: '#f1f5f9',   // Slate 100
                },
                dark: '#0f172a',      // Slate 900
                surface: '#ffffff',
                background: '#f8fafc', // Slate 50
                success: '#10b981',    // Emerald 500
                warning: '#f59e0b',    // Amber 500
                danger: '#ef4444',     // Red 500
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
                'card-hover': '0 0 0 1px rgba(0,0,0,0.03), 0 8px 16px rgba(0,0,0,0.08)',
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],

}
