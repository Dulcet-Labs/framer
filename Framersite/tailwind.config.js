export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./node_modules/@coinbase/onchainkit/dist/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
        extend: {
            zIndex: {
                '100': '100',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
