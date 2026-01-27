'use client'

export default function Home() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Form submitted')
  }

  return (
    <div className="flex flex-col min-h-screen justify-between">
      {/* Navigation (Super Minimal) */}
      <nav className="w-full px-6 py-8 md:px-12 flex justify-between items-center fade-in-up">
        <div className="text-2xl tracking-tight font-medium serif italic">Lemma.</div>
        <a href="#waitlist" className="text-xs uppercase tracking-widest hover:text-stone-500 transition-colors">Request Access</a>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 md:px-12 py-20 max-w-4xl mx-auto text-center">
        
        {/* Tagline from Slide 1 */}
        <p className="fade-in-up uppercase tracking-[0.2em] text-[10px] md:text-xs text-stone-500 mb-8">Practice Smarter, Learn Deeper</p>
        
        {/* Main Headline */}
        <h1 className="fade-in-up delay-100 text-6xl md:text-8xl leading-[1.0] font-light serif mb-8 text-stone-900">
          The AI that <br />
          <span className="italic text-stone-600">listens to you.</span>
        </h1>

        {/* Vision Text */}
        <p className="fade-in-up delay-200 text-lg md:text-xl font-light text-stone-600 max-w-2xl leading-relaxed mx-auto">
          Traditional tools just generate answers. We built an interface that asks you to verbalize your thinking while you solve, capturing what you actually understand.
        </p>

        {/* Waitlist / Call to Action */}
        <form id="waitlist" onSubmit={handleSubmit} className="fade-in-up delay-300 mt-16 w-full max-w-md mx-auto flex flex-col md:flex-row gap-4 items-end md:items-center">
          <div className="flex-grow w-full relative">
            <label htmlFor="email" className="sr-only">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              placeholder="Enter your email" 
              className="minimal-input w-full text-lg placeholder:text-stone-300 font-light text-stone-800"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full md:w-auto px-8 py-3 bg-stone-900 text-stone-50 hover:bg-stone-700 transition-colors duration-300 font-medium text-sm"
          >
            Join Waitlist
          </button>
        </form>

      </main>

      {/* The Vision / Manifesto Section */}
      <section className="w-full bg-[#F2F2F0] py-24 px-6 md:px-12 border-t border-stone-200/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 md:gap-24">
          
          {/* Column 1: The Gap (Based on Slides 4 & 6) */}
          <div>
            <h3 className="serif text-3xl italic mb-6 text-stone-800">Beyond the Answer</h3>
            <p className="text-stone-600 leading-relaxed mb-4 font-light">
              Students today learn procedures instead of concepts. When they get stuck, they often face &quot;eroding confidence&quot; because systems only check if the final output is correct.
            </p>
            <p className="text-stone-600 leading-relaxed font-light">
              We believe assessment needs to probe thinking, not just answers.
            </p>
          </div>

          {/* Column 2: The Solution (Based on Slide 6) */}
          <div>
            <h3 className="serif text-3xl italic mb-6 text-stone-800">Reasoning Out Loud</h3>
            <p className="text-stone-600 leading-relaxed mb-4 font-light">
              Lemma works at the pace of understanding, not curriculum timelines. By using voice reasoning and digital handwriting, we capture the complete picture of a student&apos;s thought process.
            </p>
            <p className="text-stone-600 leading-relaxed font-light">
              Real-time feedback targets misconceptions in logic, mirroring the experience of an expert human tutor.
            </p>
          </div>
        </div>
      </section>

      {/* Footer / Team */}
      <footer className="w-full px-6 py-12 md:px-12 border-t border-stone-200 bg-[#F9F9F7]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          
          <div>
            <h4 className="uppercase tracking-widest text-[10px] font-bold text-stone-400 mb-4">The Team</h4>
            <ul className="space-y-1 text-sm text-stone-500 font-light">
              <li>Shayan Ahmad</li>
              <li>Myra Rafiq</li>
              <li>Vlera Mehani</li>
              <li>Daniar Zhylangozov</li>
            </ul>
          </div>

          <div className="text-left md:text-right">
            <p className="serif italic text-xl mb-2 text-stone-800">LemmaEducation</p>
            <p className="text-[10px] text-stone-400 tracking-wide">© 2026 Lemma Education. NYUAD / startAD.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
