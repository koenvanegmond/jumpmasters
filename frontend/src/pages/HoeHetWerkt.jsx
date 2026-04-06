export default function HoeHetWerkt() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="text-5xl mb-2">🏄‍♂️</div>
        <h1 className="text-3xl font-black text-white">Jump Masters</h1>
        <p className="text-jm-muted text-base max-w-xl mx-auto leading-relaxed">
          Jump Masters is de interne kitesurf competitie van Skuytevaert.
          Hier draait alles om fun, progressie en gezonde competitie op het water.
          Upload je beste sessies en zie direct hoe jij scoort ten opzichte van de andere leden.
        </p>
      </div>

      {/* Score */}
      <section className="card p-6 space-y-4">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <span>📊</span> De Scoreberekening
        </h2>
        <p className="text-jm-muted text-sm leading-relaxed">
          Elke sessie wordt objectief beoordeeld op basis van je Surfr-data.
          Omdat we hoogte het belangrijkst vinden, telt deze het zwaarst mee in de formule:
        </p>
        <div className="space-y-2">
          {[
            { label: 'Hoogte', factor: '2,5×', color: '#E8196A', bar: 'w-full' },
            { label: 'Airtime', factor: '1,5×', color: '#0EA5E9', bar: 'w-3/5' },
            { label: 'Afstand', factor: '0,25×', color: '#8B5CF6', bar: 'w-1/4' },
          ].map(({ label, factor, color, bar }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="w-20 text-sm font-semibold text-white">{label}</div>
              <div className="flex-1 rounded-full h-2 bg-white/10">
                <div className={`${bar} h-2 rounded-full`} style={{ background: color }} />
              </div>
              <div className="w-12 text-right text-sm font-black" style={{ color }}>{factor}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-5 text-center mt-2 border border-white/10" style={{ background: 'rgba(232,25,106,0.06)' }}>
          <p className="text-xs text-jm-muted mb-2 uppercase tracking-widest font-semibold">De Formule</p>
          <p className="text-white font-mono text-sm leading-relaxed">
            ( Hoogte × 2,5 ) + ( Airtime × 1,5 ) + ( Afstand × 0,25 )
          </p>
          <div className="border-t border-white/10 my-2 mx-12" />
          <p className="text-white font-mono text-sm">10</p>
          <p className="text-jm-muted text-xs mt-3">= <span className="text-white font-black text-base">Eindscore</span></p>
        </div>
      </section>

      {/* Stappen */}
      <section className="space-y-5">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <span>📲</span> Hoe doe je mee?
        </h2>
        <p className="text-jm-muted text-sm leading-relaxed">
          Het is essentieel dat je de juiste afbeelding uploadt, anders kan het systeem je score niet automatisch uitlezen.
          Volg deze stappen:
        </p>

        {[
          {
            nr: 1,
            tekst: 'Open de Surfr app en ga naar de sessie die je wilt uploaden.',
            img: null,
            alt: null,
          },
          {
            nr: 2,
            tekst: 'Klik op het deel-icoontje (de drie verbonden bolletjes) onder je sessie-samenvatting, direct naast het hartje.',
            img: '/stap2.png',
            alt: 'Surfr app — deel-icoontje',
          },
          {
            nr: 3,
            tekst: "Kies voor 'Save Image' of 'Opslaan' om de officiële samenvatting in je galerij te zetten.",
            img: '/stap3.png',
            alt: 'Surfr app — opslaan',
          },
          {
            nr: 4,
            tekst: 'Ga naar de Jump Masters website en upload dit bestand.',
            img: '/stap4.png',
            alt: 'Jump Masters — uploaden',
          },
        ].map(({ nr, tekst, img, alt }) => (
          <div key={nr} className="card p-5 flex flex-col sm:flex-row gap-5 items-start">
            <div className="flex-shrink-0 flex items-center gap-4 sm:gap-0 sm:flex-col sm:items-center">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: 'var(--jm-pink)', color: 'white' }}>
                {nr}
              </div>
              {img && (
                <div className="sm:mt-3 w-28 sm:w-32 flex-shrink-0">
                  <img src={img} alt={alt}
                    className="w-full rounded-xl border border-white/10 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }} />
                  <div className="hidden w-full aspect-[9/16] rounded-xl border border-dashed border-white/20 items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="text-jm-muted text-xs text-center px-2">Foto volgt<br />binnenkort</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-white/90 text-sm leading-relaxed pt-1">{tekst}</p>
          </div>
        ))}

        {/* Warning box */}
        <div className="rounded-2xl p-4 border flex gap-3" style={{ background: 'rgba(251,191,36,0.07)', borderColor: 'rgba(251,191,36,0.25)' }}>
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-bold text-yellow-300 mb-1">Belangrijk</p>
            <p className="text-sm text-yellow-200/80 leading-relaxed">
              Maak <strong>geen</strong> screenshot van je hele telefoonscherm.
              De automatische scan werkt alleen met de officiële deel-afbeelding uit de Surfr app.
            </p>
          </div>
        </div>

        {/* Tip */}
        <div className="rounded-2xl p-4 border flex gap-3" style={{ background: 'rgba(232,25,106,0.07)', borderColor: 'rgba(232,25,106,0.25)' }}>
          <span className="text-xl flex-shrink-0">💡</span>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--jm-muted)' }}>
            <span className="text-white font-semibold">Tip:</span> Heb je iemands record verbroken?
            Gebruik de <span className="text-jm-pink font-semibold">@tag</span> functie tijdens het posten om diegene direct uit te dagen!
          </p>
        </div>
      </section>

      {/* Rankings */}
      <section className="card p-6 space-y-5">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <span>🏆</span> Rankings &amp; Prijzen
        </h2>
        <p className="text-jm-muted text-sm leading-relaxed">
          Je kunt jezelf op verschillende manieren meten met de rest:
        </p>
        <div className="space-y-3">
          {[
            { icon: '📅', title: 'Daily Leaderboard', desc: 'Wie was de koning van de dag?' },
            { icon: '📈', title: 'Seizoen Ranking', desc: 'Je positie gebaseerd op je beste sessies van het jaar.' },
            { icon: '⚓', title: 'Vloot Klassement', desc: 'De strijd binnen jouw eigen fleet (Bronze, Silver, Gold, Platinum).' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="text-sm text-jm-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.07] pt-4">
          <h3 className="text-base font-black text-white mb-3">De Prijsuitreiking 🎖️</h3>
          <p className="text-jm-muted text-sm leading-relaxed">
            Aan het eind van het seizoen kronen we de winnaars. Voor de nummers <strong className="text-white">1, 2 en 3</strong> van
            elke fleet staat er een officiële trofee klaar tijdens de prijsuitreiking.
          </p>
          <div className="flex justify-center gap-4 mt-5">
            {[
              { pos: '🥇', label: '#1', size: 'text-5xl mt-0' },
              { pos: '🥈', label: '#2', size: 'text-4xl mt-2' },
              { pos: '🥉', label: '#3', size: 'text-4xl mt-2' },
            ].map(({ pos, label, size }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className={size}>{pos}</span>
                <span className="text-xs text-jm-muted font-bold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
