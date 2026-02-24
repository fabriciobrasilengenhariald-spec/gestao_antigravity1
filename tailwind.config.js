/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: '#0067b4',
                    secondary: '#01a4f1',
                    accent: '#ff6201',
                    dark: '#0b1426',
                    card: '#151d2e',
                    sidebar: '#0f1720',
                    success: '#10b981',
                    error: '#ef4444'
                }
            }
        },
    },
    plugins: [],
}
