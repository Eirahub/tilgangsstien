// All wizard content. Sources for the links are listed in docs/KILDER.md.
// A choice without "til" is not built yet and is shown as disabled.

const UBUNTU_PASSORD = {
  tekst: 'Ubuntu: endre passord, også for andre brukere',
  url: 'https://help.ubuntu.com/stable/ubuntu-help/user-changepassword.html',
};
const UBUNTU_KRYPTERING = {
  tekst: 'Ubuntu: diskkryptering og gjenopprettingsnøkkel',
  url: 'https://ubuntu.com/desktop/docs/en/latest/how-to/configure-hardware-backed-disk-encryption/',
};
const ZORIN_FORUM = {
  tekst: 'Zorin-forumet, sammen med en voksen',
  url: 'https://forum.zorin.com',
};

export const TRYGGHETSREGLER = [
  'Ikke del passord eller engangskoder med noen, heller ikke på et forum.',
  'Ikke bruk nettsider eller programmer som lover å knekke eller fjerne passord.',
  'Skriv adressen selv i stedet for å følge lenker fra meldinger.',
  'Vær skeptisk hvis noen tar kontakt og tilbyr deg hjelp med pc-en.',
];

export const VEIVISER = {
  start: 'pc',
  noder: {
    pc: {
      type: 'sporsmal',
      stopp: 'Pc',
      tittel: 'Hvilken pc vil du inn på?',
      ingress: 'Trykk på det som passer. Vi spør aldri om navn eller passord, og ingenting blir lagret.',
      valg: [
        { tekst: 'Min egen pc', beskrivelse: 'Pc-en er din eller familiens.', kort: 'Egen pc', til: 'system' },
        { tekst: 'Skolepc', beskrivelse: 'Pc-en eller kontoen er fra skolen.' },
        { tekst: 'Lånt pc', beskrivelse: 'Du har lånt pc-en av noen.' },
      ],
    },
    system: {
      type: 'sporsmal',
      stopp: 'System',
      tittel: 'Hvilket system har pc-en?',
      ingress: 'Rådene er ulike fra system til system.',
      valg: [
        { tekst: 'Ubuntu eller Zorin', beskrivelse: 'Navnet står ofte på skjermen når pc-en starter.', kort: 'Ubuntu/Zorin', til: 'linux-problem' },
        { tekst: 'Windows 10 eller 11', beskrivelse: 'Windows-logoen vises når pc-en starter.' },
        { tekst: 'Mac', beskrivelse: 'Apple-logoen vises når pc-en starter.' },
        { tekst: 'Vet ikke', beskrivelse: 'Vi hjelper deg å finne ut av det.' },
      ],
    },
    'linux-problem': {
      type: 'sporsmal',
      stopp: 'Problem',
      tittel: 'Hva skjer når du prøver?',
      ingress: 'Velg det som ligner mest.',
      valg: [
        { tekst: 'Jeg har glemt passordet', beskrivelse: 'Du husker ikke passordet til kontoen din.', kort: 'Glemt passord', til: 'linux-glemt' },
        { tekst: 'Jeg har prøvd mange ganger', beskrivelse: 'Innloggingen virker ikke, selv om du tror passordet er riktig.', kort: 'Mange forsøk', til: 'linux-forsok' },
        { tekst: 'Den vil ha passord før systemet starter', beskrivelse: 'Du blir spurt før du kommer til innloggingen.', kort: 'Kryptert disk', til: 'linux-kryptert' },
        { tekst: 'Noen kan ha endret passordet', beskrivelse: 'Du tror noen andre har vært inne på pc-en.', kort: 'Noen andre', til: 'linux-andre' },
      ],
    },
    'linux-glemt': {
      type: 'rad',
      stopp: 'Råd',
      tittel: 'Nullstill passordet fra oppstartsmenyen',
      ingress: 'På en Ubuntu- eller Zorin-pc du eier selv, kan du nullstille passordet fra recovery-menyen. Sjekk først Caps Lock, Num Lock og tastaturspråk, i tilfelle passordet er riktig likevel.',
      varsel: 'Bruk dette bare på en pc du eier selv. Metoden virker på hvilken som helst maskin, og å skaffe seg tilgang til andres pc uten lov er ulovlig. Er disken kryptert, blir du bedt om et passord før systemet starter. Da trenger du det passordet eller gjenopprettingsnøkkelen, og du går tilbake og velger «Den vil ha passord før systemet starter».',
      steg: [
        { tekst: 'Start pc-en på nytt. Rett etter logoen holder du inne Shift, eller trykker Esc gjentatte ganger, til oppstartsmenyen GRUB vises.' },
        { tekst: 'Velg «Advanced options for Ubuntu» (eller Zorin), og så linjen som slutter på «(recovery mode)». Trykk Enter.' },
        { tekst: 'I recovery-menyen velger du linjen «root  Drop to root shell prompt» og trykker Enter. Nå står du i et skall som root.' },
        { tekst: 'Gjør filsystemet skrivbart:', kode: 'mount -o remount,rw /' },
        { tekst: 'Ser du ikke brukernavnet ditt, list brukerne:', kode: 'ls /home' },
        { tekst: 'Sett nytt passord. Bytt ut NAVN med brukernavnet ditt:', kode: 'passwd NAVN' },
        { tekst: 'Skriv det nye passordet to ganger. Tegnene vises ikke mens du skriver.' },
        { tekst: 'Start pc-en på nytt og logg inn med det nye passordet:', kode: 'reboot' },
      ],
      hjelp: 'Har en annen person en administratorkonto på pc-en, er det enkleste at de endrer passordet for deg i Innstillinger, under Brukere. I nyere Ubuntu ligger Brukere under System.',
      lenker: [UBUNTU_PASSORD, ZORIN_FORUM],
    },
    'linux-forsok': {
      type: 'rad',
      stopp: 'Råd',
      tittel: 'Ta en pause fra gjettingen',
      ingress: 'Noen pc-er er satt opp til å stenge en stund etter mange feil. Flere forsøk kan gjøre ventetiden lengre.',
      steg: [
        'Slutt å gjette, og vent noen minutter.',
        'Start pc-en på nytt på vanlig måte.',
        'Sjekk Caps Lock, Num Lock og tastaturspråk.',
        'Prøv rolig én gang til. Virker det fortsatt ikke, har du trolig glemt passordet. Gå tilbake og velg «Jeg har glemt passordet» for å nullstille det.',
      ],
      hjelp: 'En voksen du stoler på, eller den som installerte systemet på pc-en.',
      lenker: [UBUNTU_PASSORD, ZORIN_FORUM],
    },
    'linux-kryptert': {
      type: 'rad',
      stopp: 'Råd',
      tittel: 'Disken din er trolig kryptert',
      ingress: 'Dette er et eget passord som beskytter filene dine. Det er ofte et annet passord enn det du logger inn med.',
      varsel: 'Ikke installer systemet på nytt før du har fått hjelp. Da kan filene dine bli borte for godt. Uten passordet eller gjenopprettingsnøkkelen kan de trolig ikke hentes tilbake.',
      steg: [
        'Skriv passordet rolig en gang til. Æ, ø, å og tegn kan ligge på andre taster på dette skjermbildet.',
        'Sjekk om du eller den som installerte systemet har lagret en gjenopprettingsnøkkel, for eksempel på papir eller på en minnepinne.',
        'Finner du ikke passordet eller nøkkelen, snakk med en voksen før du gjør noe mer.',
      ],
      hjelp: 'Den som installerte systemet. Det er ofte den personen som valgte passordet.',
      lenker: [UBUNTU_KRYPTERING, ZORIN_FORUM],
    },
    'linux-andre': {
      type: 'rad',
      stopp: 'Råd',
      tittel: 'Si fra til en voksen nå',
      ingress: 'Det er ikke din feil. Du trenger ikke å finne ut av dette alene.',
      steg: [
        'Fortell en voksen du stoler på hva som har skjedd.',
        'Ikke prøv å finne ut selv hvem det var.',
        'Bruk en annen enhet du stoler på, og bytt passord på viktige kontoer, som e-post.',
        'Får du meldinger som krever penger eller passord? Ikke svar. Vis dem til den voksne.',
      ],
      hjelp: 'En forelder, en lærer eller en annen voksen du stoler på.',
      lenker: [UBUNTU_PASSORD],
    },
  },
};
