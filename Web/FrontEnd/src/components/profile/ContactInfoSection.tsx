import { MailOutlined, PhoneOutlined } from "@ant-design/icons";

interface ContactInfoSectionProps {
  email: string;
  phone: string;
}

export default function ContactInfoSection({ email, phone }: ContactInfoSectionProps) {
  const safeEmail = email?.trim() ? email : "No registrado";
  const safePhone = phone?.trim() ? phone : "No registrado";

  return (
    <section>
      <h2 className="text-xl md:text-2xl text-[#1a1a1a] font-medium mb-4">Información de Contacto</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article className="bg-[#f9fafb] rounded-2xl p-6">
          <div className="flex items-center gap-3 text-[#6B7280]">
            <span className="w-9 h-9 rounded-lg bg-[#027EB1] text-white grid place-items-center">
              <MailOutlined />
            </span>
            <span className="text-xs md:text-sm">Correo Electrónico</span>
          </div>
          <p className="mt-3 text-[#1A1A1A] text-sm md:text-lg break-all">{safeEmail}</p>
        </article>

        <article className="bg-[#f9fafb] rounded-2xl p-6">
          <div className="flex items-center gap-3 text-[#6B7280]">
            <span className="w-9 h-9 rounded-lg bg-[#003E7B] text-white grid place-items-center">
              <PhoneOutlined />
            </span>
            <span className="text-xs md:text-sm">Teléfono</span>
          </div>
          <p className="mt-3 text-[#1A1A1A] text-sm md:text-lg">{safePhone}</p>
        </article>
      </div>
    </section>
  );
}
