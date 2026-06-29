import React, { useState, useEffect } from "react";
import { Modal, Input, Button as AntButton, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { crearCategoria } from "../../api/products/categorias";

interface CategoryModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: (categoryName?: string) => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpg", "image/jpeg", "image/svg+xml"];

export default function CategoryModal({ open, onCancel, onSuccess }: CategoryModalProps) {
    const [name, setName] = useState("");
    const [active, setActive] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open]);

    useEffect(() => {
        return () => {
            if (preview && preview.startsWith("blob:")) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const resetForm = () => {
        setName("");
        setActive(true);
        setFile(null);
        if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] ?? null;
        if (!selectedFile) return;

        if (!ALLOWED_IMAGE_TYPES.includes(selectedFile.type)) {
            Modal.error({ title: "Formato inválido", content: "Solo se permiten imágenes PNG, JPG, JPEG o SVG." });
            event.target.value = "";
            return;
        }

        if (selectedFile.size > MAX_IMAGE_SIZE) {
            Modal.error({ title: "Imagen demasiado pesada", content: "La imagen debe ser menor a 5 MB." });
            event.target.value = "";
            return;
        }

        setFile(selectedFile);
        if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }
        setPreview(URL.createObjectURL(selectedFile));
    };

    const handleSubmit = async () => {
        const nombreLimpio = name.trim();
        if (nombreLimpio === "") {
            Modal.error({ title: "Campo requerido", content: "El nombre de la categoría es obligatorio." });
            return;
        }

        if (nombreLimpio.length > 50) {
            Modal.error({ title: "Nombre inválido", content: "El nombre no puede tener más de 50 caracteres." });
            return;
        }

        if (!file) {
            Modal.error({ title: "Imagen requerida", content: "Debes seleccionar una imagen para la categoría." });
            return;
        }

        try {
            await crearCategoria({
                nombre: nombreLimpio,
                imagen: file,
                activo: active,
            });

            message.success("La categoría se creó correctamente.");
            onSuccess(nombreLimpio);
            onCancel();
        } catch (error: any) {
            console.error("Error al crear categoría:", error);
            const message = error?.response?.data?.msg || "No se pudo crear la categoría. Inténtalo de nuevo.";
            Modal.error({ title: "Error", content: message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            centered
            width={480}
            closable={false}
            className="[&_.ant-modal-content]:!rounded-[18px] [&_.ant-modal-content]:!overflow-hidden [&_.ant-modal-content]:!p-0 max-md:[&_.ant-modal]:!w-[calc(100vw-24px)]"
        >
            <div className="border-b border-[#E5E7EB] px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#1F2937]">Crear Categoría</h2>
                        <p className="mt-1 text-sm text-[#6B7280]">Completa los datos para crear una nueva categoría.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-[24px] leading-none text-[#6B7280]"
                    >
                        ×
                    </button>
                </div>
            </div>

            <div className="px-5 py-4">
                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#374151]">Nombre de la categoría</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. SUV, Camioneta, Sedan..."
                            className="h-[42px] rounded-xl"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#374151]">Ícono de la categoría</label>
                        <label className="flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-[#D1D5DB] bg-white px-4 py-4 text-center transition hover:border-[#027EB1]">
                            {preview ? (
                                <img src={preview} alt="Preview" className="max-h-[60px] object-contain" />
                            ) : (
                                <>
                                    <UploadOutlined className="mb-2 text-[26px] text-[#9CA3AF]" />
                                    <span className="text-[16px] font-medium text-[#4B5563]">Subir ícono</span>
                                    <span className="mt-1 text-sm text-[#9CA3AF]">PNG, JPG o SVG</span>
                                </>
                            )}
                            <input type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#E5E7EB] px-5 py-3 sm:flex-row sm:justify-end sm:gap-3">
                <AntButton
                    className="h-[42px] w-full border border-gray-400 px-6 sm:w-auto"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancelar
                </AntButton>

                <AntButton
                    className="h-[42px] rounded-xl border-0 px-5 text-sm font-bold !text-white !bg-[#027eb1] shadow-md transition-all hover:!bg-[#026a96] hover:shadow-lg active:!bg-[#025a80]"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Creando..." : "Crear"}
                </AntButton>
            </div>
        </Modal>
    );
}
