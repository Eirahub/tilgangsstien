# Kilder

Offisielle kilder bak rådene. Sist sjekket 2026-11-05.

## Ubuntu og Zorin OS

| Brukes til | Adresse | Hva som er sjekket |
| --- | --- | --- |
| En administrator kan sette nytt passord for en annen bruker, i Innstillinger, under System og Brukere | https://help.ubuntu.com/stable/ubuntu-help/user-changepassword.html | Lest via søkeindeks. Siden svarte 503 ved direkte henting, så teksten bør leses på nytt |
| Diskkryptering og gjenopprettingsnøkkel | https://ubuntu.com/desktop/docs/en/latest/how-to/configure-hardware-backed-disk-encryption/ | Lest via søkeindeks. Gjelder maskinvarestøttet kryptering, ikke vanlig LUKS-passord |
| Hjelp fra andre Zorin-brukere | https://forum.zorin.com | Oppgitt som fellesskapskanal på https://help.zorin.com/ |

## Ikke verifisert ennå

Disse rådene bygger på allmenn kunnskap, ikke en offisiell kilde, og bør leses av noen som kjenner systemene:

- At Ubuntu og Zorin vanligvis ikke har noen «glemt passord»-knapp. Zorins hjelpesider dekker ikke temaet, og det eneste funnet er et svar på Zorin-forumet.
- At noen pc-er stenger en stund etter mange feil forsøk. Ingen side som kunne leses, dekker dette, så rådet er formulert som en mulighet.
- At filene trolig ikke kan hentes tilbake uten passord eller nøkkel ved vanlig LUKS-kryptering.
- At tastaturoppsettet kan være et annet på skjermbildet for diskpassord.

## Nullstilling via recovery (egen pc)

Rådet «Nullstill passordet fra oppstartsmenyen» viser GRUB, recovery mode og `passwd`. Dette er standard gjenoppretting på en Linux-pc du eier selv, dokumentert av blant andre Ubuntu. Kommandoene er ekte og testet mot kjent dokumentasjon, men ikke prøvd på en faktisk Ubuntu- eller Zorin-maskin herfra.

Grense som håndheves i koden: metoden virker på hvilken som helst maskin og kan ikke sjekke eierskap. Derfor

- vises kommandoene bare på egen-pc-veien, aldri på skolepc eller lånt pc,
- har rådet en tydelig eierskapsadvarsel om at tilgang til andres pc uten lov er ulovlig,
- feiler testene (`frontend/veiviser.test.mjs`) hvis en bypass-kommando dukker opp på skolepc- eller lånt-pc-veien, eller hvis et slikt steg mangler eierskapsadvarsel.

Virker ikke på kryptert disk. Den veien peker fortsatt til passord eller gjenopprettingsnøkkel.

## Skrifter

Instrument Sans og Instrument Serif ligger lokalt i `frontend/fonts/`, under SIL Open Font License 1.1. Lisenstekstene ligger i samme mappe. Filene er hentet fra Fontsource-pakkene, versjon 5.2.5.
