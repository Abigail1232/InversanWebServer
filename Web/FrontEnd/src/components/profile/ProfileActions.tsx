import { EditOutlined, LogoutOutlined, RightOutlined, SettingOutlined } from "@ant-design/icons";

interface ProfileActionsProps {
  onLogout: () => void;
  onEditProfile: () => void;
  onChangePassword: () => void;
}

export default function ProfileActions({ onLogout, onEditProfile, onChangePassword }: ProfileActionsProps) {
  return (
    <aside className="rounded-2xl border border-[#E5E7EB] bg-white p-4 md:p-5 space-y-3 shadow-sm">
      <p className="text-xs md:text-sm font-semibold text-[#6B7280] uppercase tracking-wide">Acciones de cuenta</p>

      <button
        onClick={onLogout}
        className="w-full h-12 md:h-14 rounded-xl bg-[#D61216] text-white text-sm md:text-base font-semibold flex items-center justify-between px-4"
      >
        <span className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-white/20 grid place-items-center">
            <LogoutOutlined />
          </span>
          Cerrar Sesión
        </span>
        <RightOutlined className="text-xs" />
      </button>

      <button
        onClick={onEditProfile}
        className="w-full h-12 md:h-14 border border-[#DCE7F3] rounded-xl bg-[#F8FBFF] text-[#0A0A0A] text-sm md:text-base font-medium flex items-center justify-between px-4"
      >
        <span className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-[#E7F3FF] text-[#027EB1] grid place-items-center">
            <EditOutlined />
          </span>
          Editar Perfil
        </span>
        <RightOutlined className="text-xs text-[#6B7280]" />
      </button>

      <button
        onClick={onChangePassword}
        className="w-full h-12 md:h-14 border border-[#DCE7F3] rounded-xl bg-[#F8FBFF] text-[#0A0A0A] text-sm md:text-base font-medium flex items-center justify-between px-4"
      >
        <span className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-[#E7F3FF] text-[#027EB1] grid place-items-center">
            <SettingOutlined />
          </span>
          Cambiar Contraseña
        </span>
        <RightOutlined className="text-xs text-[#6B7280]" />
      </button>
    </aside>
  );
}
