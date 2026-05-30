# NepTaxSathi — Nepal Tax Calculator

A modern, responsive, and privacy-first web application designed for salaried employees in Nepal to calculate and compare their tax liability under the **Old Slab (FY 2082/83)** vs the **New Slab (FY 2083/84)**.

---

## 🌟 Key Features

- **Side-by-Side Comparison**: Instantly see your total income, deductions, taxable income, progressive tax slab breakdown, total yearly/monthly tax, and net income (cash in hand) for both tax regimes in a single view.
- **SSF (Social Security Fund) Toggle**: Applies the waiver/reduction of the first 1% social security tax slab (reducing it to 0%) for SSF contributors.
- **Deduction Cap Enforcement**: Automatically enforces standard Nepalese tax deduction limits:
  - **SSF**: Up to ₨ 5,00,000
  - **Provident Fund (PF) & Citizen Investment Trust (CIT)**: Up to ₨ 3,00,000 (combined)
  - **Life Insurance Premium**: Up to ₨ 40,000
  - **Donations**: Support for donations and other deductions.
- **Marital Status Adjustment**: Choose between **Individual** and **Couple** status. The application automatically updates the respective progressive slab thresholds.
- **Adaptive Layout**: Features a rich two-column dashboard on desktop screen sizes and a smooth, swipeable tabbed navigation system for mobile viewports.
- **Privacy-First**: No data is stored, transmitted, or sent to any server. All calculations run entirely client-side in the user's browser.
- **Analytic Tracking**: Integrated with Umami Analytics to track generic user interaction events (tab switches, calculate button clicks) without compromising user privacy.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + `@tailwindcss/vite` plugin
- **UI Components**: [Radix Themes](https://www.radix-ui.com/themes) for layout, icons, dialogs, and typography
- **Build Tool**: [Vite 7](https://vite.dev/)
- **Packaging Utility**: `vite-plugin-singlefile` to facilitate building the application into a single self-contained HTML file if needed
- **Fonts**: [Nunito](https://fonts.google.com/specimen/Nunito) (Google Fonts)

---

## 📁 Project Structure

```text
neptaxsathi/
├── src/
│   ├── components/
│   │   ├── Calculation.tsx      # Handles the side-by-side comparison tables
│   │   ├── Calculator.tsx       # Mini-widget calculations & breakdown displays
│   │   ├── DataEntry.tsx        # Taxpayer type, income inputs, and deductions form
│   │   ├── DeveloperInfo.tsx    # Details of the developer
│   │   ├── Information.tsx      # Detailed documentation page on Nepal tax rules
│   │   ├── RegimeView.tsx       # Individual tax regime slab progress breakdown
│   │   └── icons.tsx            # SVG Icons (Edit, Chart, Info, etc.)
│   ├── engine/
│   │   ├── scenarios.ts         # Hardcoded old and new slab configurations
│   │   ├── taxEngine.ts         # Pure functional tax computation logic
│   │   └── types.ts             # TypeScript definitions for inputs, slabs, & outputs
│   ├── hooks/
│   │   └── useIsDesktop.ts      # Custom hook to check screen dimensions (desktop vs. mobile)
│   ├── utils/
│   │   ├── cn.ts                # Tailwind class merging utility
│   │   └── math.ts              # Mathematical / rounding utilities
│   ├── App.tsx                  # App layout, state management, and modal dialogs
│   ├── index.css                # Base CSS styles and custom UI styling rules
│   └── main.tsx                 # App mount entrypoint
├── index.html                   # HTML template (loads Nunito font & Umami script)
├── package.json                 # Project dependencies & scripts
├── tsconfig.json                # TypeScript compilation config
└── vite.config.ts               # Vite bundler configuration
```

---

## 🚀 Getting Started

To run the project locally, follow these steps:

### 1. Clone the repository and navigate to the directory
```bash
git clone <repository-url>
cd neptaxsathi
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```
Open `http://localhost:5173` (or the port specified in terminal) in your browser to view the application.

### 4. Build for production
```bash
npm run build
```
This builds and compiles the app into the `dist/` directory.

### 5. Preview production build
```bash
npm run preview
```

---

## 👨‍💻 Developer Info

Created and maintained by **Saugat Jonchhen** ([saugat.john09@gmail.com](mailto:saugat.john09@gmail.com)).

*Disclaimer: This tool is built for informational purposes only. It does not constitute professional tax or financial advice. Please consult a certified tax professional or auditor for official filings.*
