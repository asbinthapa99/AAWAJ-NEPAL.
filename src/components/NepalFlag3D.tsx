import Image from 'next/image';

export default function NepalFlag() {
  return (
    <div className="relative w-full h-full flex items-center justify-center drop-shadow-2xl">
      <Image
        src="/nepal-flag.png"
        alt="Flag of Nepal"
        width={600}
        height={732}
        priority
        className="w-full h-full object-contain animate-flag-float select-none pointer-events-none"
      />
    </div>
  );
}
