import TestChatBot from '@/components/TestChatBot'
import CopyButton from '@/components/CopyButton'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Vibe Coding Template
          </h1>
          
          <p className="text-xl text-purple-700 font-medium mb-6">
            Dit is een template om met Bolt te werken waarbij we gebruik maken van Gemini. Dit template is gemaakt door Tom Naberink
          </p>

          {/* AI voor Docenten Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <Image 
                src="/images/ai-voor-docenten-logo.png" 
                alt="AI voor Docenten Logo" 
                width={192} 
                height={96}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          
          {/* Setup Instructions */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                🔧
              </span>
              Setup Instructies
            </h2>
            
            <div className="space-y-6">
              
              {/* Step 1 - Fork GitHub Template */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Stap 1: Fork dit template in GitHub
                </h3>
                <p className="text-gray-600 mb-3">
                  Ga naar <a href="https://github.com" target="_blank" className="text-purple-600 hover:text-purple-800 underline">github.com</a> en login in. Ga dan naar deze pagina: <a href="https://github.com/TomNaberink/apitemplateTom" target="_blank" className="text-purple-600 hover:text-purple-800 underline">https://github.com/TomNaberink/apitemplateTom</a>
                </p>
                <p className="text-gray-600 mb-3">
                  Klik rechtsbovenin op '<strong>Use this template</strong>', geef het een gepaste naam voor je project en klik op '<strong>create fork</strong>'.
                </p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">GitHub Repository URL</span>
                    <CopyButton 
                      text="https://github.com/TomNaberink/apitemplateTom"
                      className="text-purple-400 hover:text-purple-300 text-xs transition-colors"
                      title="Kopieer GitHub URL"
                    />
                  </div>
                  <code>https://github.com/TomNaberink/apitemplateTom</code>
                </div>
              </div>

              {/* Step 2 - Import from GitHub in Bolt */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Stap 2: Import in Bolt.new
                </h3>
                <p className="text-gray-600 mb-3">
                  Open <a href="https://bolt.new" target="_blank" className="text-purple-600 hover:text-purple-800 underline">Bolt.new</a> en login. Selecteer '<strong>import from github</strong>' en login op GitHub. Kies dan de '<strong>repository</strong>' die je net hebt geforkt.
                </p>
              </div>

              {/* Step 3 - Create .env.local */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Stap 3: Maak een .env.local bestand
                </h3>
                <p className="text-gray-600 mb-3">
                  Als het template is geladen ga je naar het <strong>tabblad "Code"</strong>. Bij de files doe je <strong>rechtermuisknop</strong> en klik je op <strong>"New File"</strong>. Die noem je <code className="bg-gray-100 px-2 py-1 rounded text-sm">.env.local</code>. Daar binnen zet je het volgende:
                </p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <div className="flex items-center justify-end mb-2">
                    <CopyButton 
                      text="GEMINI_API_KEY=your_actual_api_key_here"
                      className="text-purple-400 hover:text-purple-300 text-xs transition-colors"
                      title="Kopieer .env.local inhoud"
                    />
                  </div>
                  <code>GEMINI_API_KEY=your_actual_api_key_here</code>
                </div>
                <p className="text-orange-600 text-sm mt-2 font-medium">
                  ⚠️ Vervang "your_actual_api_key_here" met je echte API key! (zie stap 3)
                </p>
              </div>

              {/* Step 4 - Get API Key */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Stap 4: Verkrijg een Gemini API Key
                </h3>
                <p className="text-gray-600 mb-3">
                  Ga naar Google AI Studio om je gratis API key aan te maken:
                </p>
                <a 
                  href="https://makersuite.google.com/app/apikey" 
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <span>Verkrijg API Key</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 text-sm">
                    ⚠️ <strong>Let op</strong>, je kunt gratis en risicovrij oefenen met de Gemini API. Daarnaast kun je 300,- dollar gratis budget krijgen. Als dat op, dan moet je het koppelen aan je creditcard. Zorg ervoor dat je weet wat je doet op dat moment!
                  </p>
                </div>
              </div>

              {/* Step 5 - Enhanced Test Step */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Stap 5: Test je API Key & Alle Features
                </h3>
                <TestChatBot />
              </div>

              {/* Step 6 - Build Step */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Stap 6: Bouwen maar!
                </h3>
                <p className="text-gray-600">
                  Er staat veel informatie in de <code className="bg-gray-100 px-2 py-1 rounded text-sm">README.md</code>, maar je mag ook lekker gaan viben! Wat ga jij maken om het onderwijs te verbeteren?
                </p>
              </div>

              {/* Step 7 - Deploy with Vercel */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Stap 7: Deploy met Vercel
                </h3>
                <p className="text-gray-600 mb-3">
                  Ga naar <a href="https://vercel.com" target="_blank" className="text-purple-600 hover:text-purple-800 underline">Vercel.com</a>, login en koppel je Github. Klik op <strong>'Add New'</strong> en importeer de Github die je net hebt gemaakt binnen Bolt. <strong className="text-red-600">KLIK NOG NIET OP DEPLOY</strong>. Eerst moet je de <strong>'Environment Variable'</strong> instellen:
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                  <p className="text-yellow-800 text-sm mb-2">
                    ⚙️ <strong>Environment Variables instellen:</strong>
                  </p>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>• Bij <strong>'Key'</strong> vul je <code className="bg-yellow-100 px-1 rounded">GEMINI_API_KEY</code> in</li>
                    <li>• Bij <strong>'Value'</strong> vul je je echte API key in</li>
                    <li>• Klik dan pas op <strong>'Deploy'</strong></li>
                  </ul>
                </div>
              </div>

              {/* Step 8 - Test and Share */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Stap 8: Testen en delen
                </h3>
                <p className="text-gray-600 mb-3">
                  🎉 <strong>Gefeliciteerd!</strong> Je AI-tool is nu live op het internet. Test alles zorgvuldig voordat je het deelt!
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    🌟 <strong>Tijd om te delen!</strong> Laat je collega's, studenten of vrienden zien wat je hebt gebouwd. Wie weet inspireer je anderen om ook te gaan experimenteren met AI in het onderwijs! 🚀
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-4 text-purple-600">
              <span>💜</span>
              <span>Veel succes met bouwen!</span>
              <span>💜</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              Vibe Coding Template door Tom Naberink • Powered by Bolt, Next.js & Gemini AI
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}