# GoKAnI AI - Tattoo Design Studio

GoKAnI AI is a professional AI-powered tattoo design application built with Next.js and powered by a custom Flux model via Replicate. It is designed to help artists and clients visualize their next masterpiece with high-fidelity tattoo concepts.

## ✨ Features

-   **High-Impact Tattoo Generation:** Powered by a specialized Flux model (`tattty_4_all`) for authentic urban, traditional, and realistic tattoo styles.
-   **Internalized Settings:** All complex AI parameters (Steps, Guidance, Aspect Ratio) are handled internally to ensure consistent, high-quality results.
-   **Quad-Generation:** Every prompt generates 4 unique variations simultaneously.
-   **Image-to-Image & Editing:** Upload reference images for inspiration, or send a generated design back to the workspace for iterative refinement.
-   **Smart Downloads:** Direct download support for generated designs.
-   **Mobile-First Design:** Fully responsive UI, perfect for studio use on tablets or phones.

## 🛠️ Tech Stack

-   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
-   **Language:** TypeScript
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
-   **AI Provider:** [Replicate](https://replicate.com/)

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+ installed
-   A [Replicate](https://replicate.com/) API Token

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/goka.git
    cd goka
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root directory and add your Replicate API token:
    ```env
    REPLICATE_API_TOKEN=your_token_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) to start designing!

## 📄 License

This project is for personal and professional use in tattoo design visualization.
