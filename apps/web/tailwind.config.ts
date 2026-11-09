import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import preset from "../../packages/ui/tailwind-preset";

const config: Config = {
    darkMode: ["class"],
    presets: [preset as Config],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
    theme: {
    	extend: {
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		},
    		colors: {
    			sidebar: {
    				DEFAULT: 'rgb(var(--color-sidebar) / <alpha-value>)',
    				foreground: 'rgb(var(--color-sidebar-text) / <alpha-value>)',
    				primary: 'rgb(var(--color-primary) / <alpha-value>)',
    				'primary-foreground': 'rgb(255 255 255 / <alpha-value>)',
    				accent: 'rgb(255 255 255 / 0.1)',
    				'accent-foreground': 'rgb(255 255 255 / <alpha-value>)',
    				border: 'rgb(255 255 255 / 0.1)',
    				ring: 'rgb(147 180 255 / <alpha-value>)'
    			}
    		}
    	}
    }
};

export default { ...config, plugins: [animate] } satisfies Config;
