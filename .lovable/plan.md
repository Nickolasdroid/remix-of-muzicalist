Problema este că autentificarea blochează temporar trimiterea emailului de confirmare pentru acel cont: `email rate limit exceeded`. Asta apare după prea multe încercări de înregistrare/confirmare într-un interval scurt.

Plan:
1. Ajustez setarea de limitare pentru emailurile de autentificare din backend, ca înregistrările legitime să nu fie blocate atât de repede.
2. Păstrez confirmarea emailului activă — nu voi dezactiva verificarea emailului.
3. Îmbunătățesc mesajul afișat în aplicație pentru acest caz, ca utilizatorul să vadă un text clar în română în loc de eroarea tehnică.
4. Verific fluxul de înregistrare artist și user ca ambele să trateze corect aceeași eroare.

Detalii tehnice:
- Eroarea vine din apelul de creare cont (`signUp`) înainte de selecția planului.
- Fixul principal este în configurarea autentificării, nu în plata/checkout-ul planului.
- În frontend voi mapa `email rate limit exceeded` la un mesaj de tip: „Ai încercat de prea multe ori. Te rugăm să aștepți câteva minute sau verifică emailurile primite deja.”