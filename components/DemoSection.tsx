'use client'

import { useEffect, useRef } from 'react'

export default function DemoSection() {
  const overlayRef = useRef<HTMLDivElement>(null)
  const step1Ref = useRef<SVGGElement>(null)
  const mistakeRef = useRef<SVGGElement>(null)
  const correctionRef = useRef<SVGGElement>(null)
  const step2Ref = useRef<SVGGElement>(null)
  const step3Ref = useRef<SVGGElement>(null)
  const sBubRef = useRef<HTMLDivElement>(null)
  const aBubRef = useRef<HTMLDivElement>(null)
  const sTextRef = useRef<HTMLParagraphElement>(null)
  const aTextRef = useRef<HTMLParagraphElement>(null)

  const startDemo = () => {
    const overlay = overlayRef.current
    const step1 = step1Ref.current
    const mistake = mistakeRef.current
    const correction = correctionRef.current
    const step2 = step2Ref.current
    const step3 = step3Ref.current
    const sBub = sBubRef.current
    const aBub = aBubRef.current
    const sText = sTextRef.current
    const aText = aTextRef.current

    if (!overlay || !step1 || !mistake || !correction || !step2 || !step3 || !sBub || !aBub || !sText || !aText) return

    // Reset
    ;[step1, mistake, correction, step2, step3].forEach((el) => {
      el.style.strokeDashoffset = '1000'
      el.style.transition = 'none'
    })
    sBub.classList.remove('active', 'speaking')
    aBub.classList.remove('active', 'speaking')

    overlay.style.opacity = '0'
    setTimeout(() => {
      overlay.style.display = 'none'
    }, 300)

    // 1. Write Step 1: 3(x+3)=24
    setTimeout(() => {
      step1.style.transition = 'stroke-dashoffset 2s ease-out'
      step1.style.strokeDashoffset = '0'
    }, 500)

    // 2. Student speaks reasoning
    setTimeout(() => {
      sText.innerText = "Okay, expanding... 3 times x is 3x... plus the 3 is 24."
      sBub.classList.add('active', 'speaking')
    }, 2600)

    // 3. Write Mistake: 3x + 3 = 24
    setTimeout(() => {
      sBub.classList.remove('speaking')
      mistake.style.transition = 'stroke-dashoffset 2s ease-out'
      mistake.style.strokeDashoffset = '0'
    }, 5500)

    // 4. AI Nudge (Socratic)
    setTimeout(() => {
      aText.innerText = "Hold on. Does the 3 on the outside only multiply the first term?"
      aBub.classList.add('active', 'speaking')
    }, 7800)

    // 5. Student Realization
    setTimeout(() => {
      aBub.classList.remove('speaking')
      sText.innerText = "Oh! It distributes to the 3 too. So it should be 9."
      sBub.classList.add('speaking')
    }, 11500)

    // 6. Correction Animation (Cross out 3, write 9)
    setTimeout(() => {
      sBub.classList.remove('speaking')
      correction.style.transition = 'stroke-dashoffset 1s ease-out'
      correction.style.strokeDashoffset = '0'
    }, 14500)

    // 7. AI Encouragement
    setTimeout(() => {
      aText.innerText = "Spot on. Fix that and keep going."
      aBub.classList.add('speaking')
    }, 16000)

    // 8. Student Continues: "Subtract 9..."
    setTimeout(() => {
      aBub.classList.remove('speaking')
      sText.innerText = "Okay, 24 minus 9 is 15. So 3x equals 15."
      sBub.classList.add('speaking')
    }, 19000)

    // 9. Write Step 2: 3x = 15
    setTimeout(() => {
      sBub.classList.remove('speaking')
      step2.style.transition = 'stroke-dashoffset 2s ease-out'
      step2.style.strokeDashoffset = '0'
    }, 22000)

    // 10. Student Finishes
    setTimeout(() => {
      sText.innerText = "Divide by 3... x equals 5."
      sBub.classList.add('speaking')
    }, 24500)

    // 11. Write Step 3: x = 5
    setTimeout(() => {
      sBub.classList.remove('speaking')
      step3.style.transition = 'stroke-dashoffset 1.5s ease-out'
      step3.style.strokeDashoffset = '0'
    }, 26500)

    // 12. Final AI
    setTimeout(() => {
      aText.innerText = "Perfectly solved."
      aBub.classList.add('speaking')
    }, 28500)
  }

  return (
    <section className="w-full py-24 px-6 md:px-12 relative z-10 flex flex-col items-center border-t border-[#D1DBD7] bg-[#F2F5F4]">
      <div className="max-w-4xl w-full">
        <h3 className="serif text-3xl italic mb-10 text-[#0F2922] text-center">Experience the Difference</h3>
        
        <div className="demo-container flex flex-col relative" id="demo-player">
          
          {/* Toolbar */}
          <div className="h-12 border-b border-gray-100 flex items-center px-4 justify-between bg-white/95 backdrop-blur-sm z-20">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-black/10"></div>
              <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-black/10"></div>
              <div className="w-3 h-3 rounded-full bg-[#28C840] border border-black/10"></div>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Live Session • Algebra I</div>
            <div className="w-10"></div>
          </div>

          {/* Canvas Area */}
          <div className="flex-grow relative bg-[#FAFAF9] p-8 cursor-crosshair overflow-hidden">
            
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 800 600" id="writing-layer">
              
              {/* SHIFT EVERYTHING LEFT using a Group Transform */}
              <g transform="translate(-60, 0)">
              
                {/* Problem: 3(x + 3) = 24 */}
                <g ref={step1Ref} id="step1-group" className="path-draw" stroke="#0F2922" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  {/* 3( */}
                  <path d="M150,100 C180,100 180,120 160,125 C180,130 180,150 150,150" />
                  <path d="M185,95 C175,105 175,145 185,155" /> 
                  {/* x + 3 */}
                  <path d="M200,115 L225,150 M225,115 L200,150" /> 
                  <path d="M250,132 L280,132 M265,117 L265,147" /> 
                  <path d="M290,100 C320,100 320,120 305,125 C320,130 320,150 290,150" /> 
                  {/* ) = 24 */}
                  <path d="M335,95 C345,105 345,145 335,155" /> 
                  <path d="M370,125 L400,125 M370,140 L400,140" /> 
                  {/* Redrawn '2' for clarity */}
                  <path d="M430,105 Q450,90 460,115 Q450,135 430,150 L465,150" /> {/* Clear 2 */}
                  <path d="M480,110 L470,140 L495,140 M490,115 L490,155" /> {/* 4 */}
                </g>
                
                {/* MISTAKE: 3x + 3 = 24 (Forgot to distribute) */}
                <g ref={mistakeRef} id="mistake-group" className="path-draw" stroke="#0F2922" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M150,230 C180,230 180,250 160,255 C180,260 180,280 150,280" /> {/* 3 */}
                  <path d="M200,245 L225,280 M225,245 L200,280" /> {/* x */}
                  <path d="M250,262 L280,262 M265,247 L265,277" /> {/* + */}
                  <path d="M290,230 C320,230 320,250 305,255 C320,260 320,280 290,280" /> {/* 3 */}
                  <path d="M370,255 L400,255 M370,270 L400,270" /> {/* = */}
                  {/* Redrawn '2' */}
                  <path d="M430,235 Q450,220 460,245 Q450,265 430,280 L465,280" /> {/* Clear 2 */}
                  <path d="M480,240 L470,270 L495,270 M490,245 L490,285" /> {/* 4 */}
                </g>

                {/* CORRECTION: Cross out 3, write 9 */}
                <g ref={correctionRef} id="correction-group" className="path-draw" stroke="#16423C" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  {/* Cross out the 3 */}
                  <path d="M280,230 L320,280" stroke="#D95C5C" strokeOpacity="0.8" />
                  {/* Write 9 */}
                  <path d="M320,220 C300,220 300,240 320,240 C320,240 320,220 320,260" transform="translate(15, 30)" stroke="#16423C" /> 
                </g>
                
                {/* STEP 2: 3x = 15 */}
                <g ref={step2Ref} id="step2-group" className="path-draw" stroke="#0F2922" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M150,340 C180,340 180,360 160,365 C180,370 180,390 150,390" /> {/* 3 */}
                  <path d="M200,355 L225,390 M225,355 L200,390" /> {/* x */}
                  <path d="M260,365 L290,365 M260,380 L290,380" /> {/* = */}
                  <path d="M320,350 L320,390" /> {/* 1 */}
                  <path d="M350,350 L340,350 L340,370 C360,365 370,385 345,390" /> {/* 5 */}
                </g>

                {/* STEP 3: x = 5 */}
                <g ref={step3Ref} id="step3-group" className="path-draw" stroke="#0F2922" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M200,455 L225,490 M225,455 L200,490" /> {/* x */}
                  <path d="M260,465 L290,465 M260,480 L290,480" /> {/* = */}
                  <path d="M350,450 L340,450 L340,470 C360,465 370,485 345,490" /> {/* 5 */}
                </g>
              
              </g> {/* End Translation Group */}
            </svg>

            {/* Feedback Bubbles - Moved to right, narrower */}
            <div className="absolute right-6 top-12 w-64 flex flex-col gap-5">
              {/* Student */}
              <div ref={sBubRef} id="bubble-student" className="voice-bubble bg-white border border-gray-100 p-4 rounded-2xl rounded-tr-none shadow-sm z-10 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">YOU</div>
                  <div className="audio-wave text-gray-300"><span></span><span></span><span></span><span></span></div>
                </div>
                <p ref={sTextRef} id="text-student" className="text-sm text-gray-600 font-light italic leading-relaxed">...</p>
              </div>

              {/* AI */}
              <div ref={aBubRef} id="bubble-ai" className="voice-bubble bg-[#16423C] text-white p-4 rounded-2xl rounded-tl-none shadow-xl z-10 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">AI</div>
                  <div className="audio-wave text-[#2C5F56]"><span></span><span></span><span></span><span></span></div>
                </div>
                <p ref={aTextRef} id="text-ai" className="text-sm font-light leading-relaxed text-gray-100">...</p>
              </div>
            </div>
          </div>

          {/* Play Button */}
          <div 
            ref={overlayRef}
            id="play-overlay" 
            className="absolute inset-0 bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all z-30 backdrop-blur-[2px]"
            onClick={startDemo}
          >
            <div className="flex flex-col items-center gap-6 play-btn-container">
              <div className="w-24 h-24 bg-[#16423C] rounded-full flex items-center justify-center shadow-2xl relative">
                <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-20"></div>
                <svg className="w-10 h-10 text-white ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <div className="bg-white px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase shadow-md text-[#16423C]">
                Watch Demo
              </div>
            </div>
          </div>
        </div>
        
        {/* Indicators */}
        <div className="flex justify-center mt-6 gap-8 opacity-60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#16423C]"></div>
            <span className="text-[10px] uppercase tracking-wider text-[#5C7069]">Voice Reasoning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#16423C]"></div>
            <span className="text-[10px] uppercase tracking-wider text-[#5C7069]">Real-time Feedback</span>
          </div>
        </div>
      </div>
    </section>
  )
}
