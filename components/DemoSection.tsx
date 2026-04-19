'use client'

export default function DemoSection() {
  return (
    <section className="relative z-10 flex w-full flex-col items-center border-t border-[#D1DBD7] bg-[#F2F5F4] px-6 py-24 md:px-12">
      <div className="w-full max-w-5xl">
        <h3 className="serif mb-10 text-center text-3xl italic text-[#0F2922]">
          Experience the Difference
        </h3>

        <div className="overflow-hidden rounded-[22px] border border-[#D8E4DF] bg-white shadow-[0_34px_80px_-46px_rgba(15,41,34,0.28)]">
          <div className="flex items-center justify-between border-b border-[#E6ECE9] bg-white/95 px-4 py-3 backdrop-blur-sm">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full border border-black/10 bg-[#FF5F57]" />
              <div className="h-3 w-3 rounded-full border border-black/10 bg-[#FEBC2E]" />
              <div className="h-3 w-3 rounded-full border border-black/10 bg-[#28C840]" />
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Product Demo
            </div>
            <div className="w-10" />
          </div>

          <div className="relative w-full bg-[#EEF3F0]" style={{ paddingBottom: '50.72916666666667%' }}>
            <iframe
              src="https://www.loom.com/embed/d2feeb92d0db49fabbaa53cf240b0511"
              className="absolute inset-0 h-full w-full"
              frameBorder="0"
              allowFullScreen
              title="Lemma Loom demo"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-8 opacity-60">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#16423C]" />
            <span className="text-[10px] uppercase tracking-wider text-[#5C7069]">Voice Reasoning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#16423C]" />
            <span className="text-[10px] uppercase tracking-wider text-[#5C7069]">Real-time Feedback</span>
          </div>
        </div>
      </div>
    </section>
  )
}
