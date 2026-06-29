import { Modal } from "antd";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Model } from "../../api/admin/models";

interface Props {
  open: boolean;
  model: Model | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ModelDeactivateModal = ({
  open,
  model,
  loading,
  onCancel,
  onConfirm
}: Props) => {
  const isActive = model?.active;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={false}
      centered
      width={420}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-auto p-6 md:p-8 text-center">

        {/* ICON */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              isActive ? "bg-red-50" : "bg-green-50"
            }`}
          >
            {isActive ? (
              <AlertTriangle className="w-6 h-6 text-red-500" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            )}
          </div>
        </div>

        {/* TITLE */}
        <h2 className="text-gray-900 font-bold text-lg mb-2">
          {isActive ? "Desactivar Modelo" : "Activar Modelo"}
        </h2>

        {/* MESSAGE */}
        <p className="text-sm text-gray-600 mb-1">
          {isActive
            ? "¿Estás seguro que deseas desactivar el modelo "
            : "¿Estás seguro que deseas activar el modelo "}
          <span className="text-gray-900 font-semibold">
            '{model?.name}'
          </span>
          ?
        </p>

        <p className="text-sm text-gray-500 mb-6">
          {isActive
            ? "Los productos asociados seguirán existiendo pero el modelo no estará disponible."
            : "El modelo volverá a estar disponible para asociar productos."}
        </p>

        {/* BUTTONS */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-3">

          <button
            type="button"
            onClick={onCancel}
            className="w-full md:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors order-2 md:order-1 font-medium"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`w-full md:w-auto px-6 py-2.5 text-white rounded-lg text-sm transition-colors order-1 md:order-2 font-medium disabled:opacity-70 ${
              isActive
                ? "bg-[#DC2626] hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading
              ? isActive
                ? "Desactivando..."
                : "Activando..."
              : isActive
              ? "Desactivar"
              : "Activar"}
          </button>

        </div>
      </div>
    </Modal>
  );
};

export default ModelDeactivateModal;
