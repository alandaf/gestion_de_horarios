import React, { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export function ImporterView({ onSuccess }: { onSuccess: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);

        const promise = window.fetch("/api/import", {
            method: "POST",
            body: formData
        }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al importar");
            return data;
        });

        toast.promise(promise, {
            loading: 'Importando desde Excel, por favor espera...',
            success: (data) => {
                setTimeout(onSuccess, 1500);
                return data.message;
            },
            error: (err) => err.message,
            finally: () => setLoading(false)
        });
    };

    return (
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Importar Horarios desde Excel</h2>
            <p className="text-gray-500 mb-8">Sube un archivo .xlsx para cargar los horarios automáticamente.</p>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 mb-6 hover:bg-gray-50 transition-colors focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer transition-colors"
                />
            </div>

            <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-[0.98]"
            >
                {loading ? "Procesando..." : "Subir e Importar"}
            </button>
        </div>
    );
}
