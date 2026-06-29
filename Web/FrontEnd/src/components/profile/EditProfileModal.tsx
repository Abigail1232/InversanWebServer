import { CloseOutlined } from "@ant-design/icons";
import { Input, Modal } from "antd";
import { useEffect, useState } from "react";
import type { ProfileFormValues } from "./types";

interface EditProfileModalProps {
  open: boolean;
  defaultValues: ProfileFormValues;
  onCancel: () => void;
  onSave: (values: ProfileFormValues) => void;
}

export default function EditProfileModal({ open, defaultValues, onCancel, onSave }: EditProfileModalProps) {
  const [form, setForm] = useState<ProfileFormValues>(defaultValues);

  useEffect(() => {
    if (open) {
      setForm(defaultValues);
    }
  }, [defaultValues, open]);

  const updateField = (field: keyof ProfileFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  };

  return (
    <>
      <style>
        {`
          .edit-profile-modal .ant-modal-content {
            border-radius: 30px !important;
            overflow: hidden;
            padding: 0 !important;
          }
          .edit-profile-modal .ant-modal-body {
            padding: 0 !important;
          }
          @media (max-width: 640px) {
            .edit-profile-modal .ant-modal-content {
              border-radius: 16px !important;
            }
          }
        `}
      </style>

      <Modal
        open={open}
        footer={null}
        closeIcon={null}
        onCancel={onCancel}
        centered
        width="min(732px, calc(100vw - 24px))"
        className="edit-profile-modal"
        styles={{ mask: { backgroundColor: "rgba(0, 0, 0, 0.62)" } }}
      >
        <div className="bg-white max-h-[90vh] overflow-y-auto">
          <div className="px-4 sm:px-8 pt-5 sm:pt-6 pb-3 border-b border-[#D1D5DB] flex items-center justify-between gap-3">
            <h3 className="text-2xl sm:text-[40px] leading-tight sm:leading-10 font-medium text-[#1A1A1A]">Editar Mi Perfil</h3>
            <button onClick={onCancel} className="text-[#9CA3AF] text-xl">
              <CloseOutlined />
            </button>
          </div>

          <div className="px-4 sm:px-6 py-5 space-y-4">
            <div>
              <label className="text-sm sm:text-base text-black">Usuario</label>
              <Input
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
                placeholder="Ingrese el Usuario aqui..."
                className="mt-1 h-11 rounded-[10px] border-[#A5A5A5] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm sm:text-base text-black">Primer Nombre</label>
                <Input
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  placeholder="Ingrese el Primer nombre aqui..."
                  className="mt-1 h-11 rounded-[10px] border-[#A5A5A5] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)]"
                />
              </div>
              <div>
                <label className="text-sm sm:text-base text-black">Segundo Nombre</label>
                <Input
                  value={form.secondName}
                  onChange={(e) => updateField("secondName", e.target.value)}
                  placeholder="Ingrese el Segundo nombre aqui..."
                  className="mt-1 h-11 rounded-[10px] border-[#A5A5A5] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm sm:text-base text-black">Primer Apellido</label>
                <Input
                  value={form.firstLastName}
                  onChange={(e) => updateField("firstLastName", e.target.value)}
                  placeholder="Ingrese el Primer Apellido aqui..."
                  className="mt-1 h-11 rounded-[10px] border-[#A5A5A5] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)]"
                />
              </div>
              <div>
                <label className="text-sm sm:text-base text-black">Segundo Apellido</label>
                <Input
                  value={form.secondLastName}
                  onChange={(e) => updateField("secondLastName", e.target.value)}
                  placeholder="Ingrese el Segundo apellido aqui..."
                  className="mt-1 h-11 rounded-[10px] border-[#A5A5A5] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm sm:text-base text-black">Correo</label>
                <Input
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="Ingrese el Correo aqui..."
                  className="mt-1 h-11 rounded-[10px] border-[#A5A5A5] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)]"
                />
              </div>
              <div>
                <label className="text-sm sm:text-base text-black">Telefono</label>
                <Input
                  value={form.phone}
                  onChange={(e) => updateField("phone", formatPhone(e.target.value))}
                  placeholder="0000-0000"
                  className="mt-1 h-11 rounded-[10px] border-[#A5A5A5] shadow-[1px_1px_0px_0.014px_rgba(107,114,128,0.75)]"
                />
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-5 py-4 sm:py-5 border-t border-[#D1D5DB] grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={onCancel}
              className="h-12 sm:h-[55px] rounded-[10px] border-2 border-[#027EB1] text-[#027EB1] text-base sm:text-[20px] font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(form)}
              className="h-12 sm:h-[55px] rounded-[10px] bg-[#027EB1] text-white text-base sm:text-[20px] font-bold"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
