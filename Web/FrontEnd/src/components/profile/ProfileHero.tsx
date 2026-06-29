import { CalendarOutlined, ClockCircleOutlined, GiftOutlined } from "@ant-design/icons";
import type { StatCard } from "./types";

interface ProfileHeroProps {
  fullName: string;
  memberSince: string;
  stats: StatCard[];
}

function StatIcon({ type }: { type?: StatCard["iconType"] }) {
  if (type === "orders") {
    return <GiftOutlined className="text-xl md:text-2xl text-white" />;
  }
  if (type === "lastOrder") {
    return <ClockCircleOutlined className="text-xl md:text-2xl text-white" />;
  }
  return null;
}

export default function ProfileHero({ fullName, memberSince, stats }: ProfileHeroProps) {
  return (
    <div className="bg-[#003E7B] rounded-b-xl shadow-md">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 md:py-10">
        <h1 className="text-white text-xl md:text-2xl font-normal">{fullName}</h1>
        <p className="mt-2 text-white/90 flex items-center gap-2 text-xs md:text-sm">
          <CalendarOutlined />
          {memberSince}
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-white/20 bg-white/10 px-4 md:px-6 py-4 md:py-5 flex items-center justify-between"
            >
              <div>
                <p className="text-white/80 text-xs md:text-sm">{stat.label}</p>
                <p className="text-white text-xl md:text-2xl leading-tight mt-1">{stat.value}</p>
              </div>
              {stat.dot ? <span className="h-3 w-3 rounded-full bg-[#10B981]" /> : <StatIcon type={stat.iconType} />}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
