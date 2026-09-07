export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex flex-col items-start gap-1.5 ${className}`}>
      <span className="font-frase text-lg font-bold uppercase leading-none tracking-tight text-texto">
        The Reset
      </span>
      <span className="flex gap-1">
        <span className="h-1 w-7 bg-acento" />
        <span className="h-1 w-12 bg-acento" />
      </span>
    </div>
  );
}
