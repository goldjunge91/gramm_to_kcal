"use client";

import { redirect } from "next/navigation";

export default function ErrorPage() {
    return (
        <div>
            <p>Entschuldige, es ist ein Fehler aufgetreten</p>
            <button
                onClick={() => redirect("/")}
                style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            >
                Zurück zur Startseite
            </button>
        </div>
    );
}
