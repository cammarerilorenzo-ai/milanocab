import jsPDF from "jspdf";

export async function generateUserGuidePDF() {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 20;

  // Colors
  const primaryColor: [number, number, number] = [245, 200, 66]; // Yellow
  const textColor: [number, number, number] = [26, 26, 26];
  const mutedColor: [number, number, number] = [100, 100, 100];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, "F");
  
  doc.setTextColor(...textColor);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Milano Cab", margin, 20);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Guida Utente - Come prenotare una corsa", margin, 28);

  y = 50;

  // Helper function for section headers
  const addSectionHeader = (number: number, title: string) => {
    doc.setFillColor(...primaryColor);
    doc.circle(margin + 6, y + 3, 6, "F");
    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(String(number), margin + 4, y + 6);
    doc.setFontSize(14);
    doc.text(title, margin + 18, y + 6);
    y += 15;
  };

  // Helper function for step items
  const addStep = (stepNum: number, text: string) => {
    doc.setFillColor(254, 243, 199);
    doc.circle(margin + 10 + 4, y + 2, 4, "F");
    doc.setTextColor(180, 83, 9);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(String(stepNum), margin + 10 + 2, y + 4);
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(text, margin + 22, y + 4);
    y += 10;
  };

  // Section 1: Install
  addSectionHeader(1, "Salva l'app sulla Home");
  
  doc.setTextColor(...mutedColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const introText = doc.splitTextToSize(
    "Milano Cab funziona come un'app ma si apre dal browser. Per averla sempre a portata di mano, salvala sulla schermata Home del tuo telefono.",
    pageWidth - margin * 2 - 10
  );
  doc.text(introText, margin + 10, y);
  y += introText.length * 5 + 8;

  // iPhone instructions
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("iPhone (Safari)", margin + 10, y);
  y += 8;

  addStep(1, "Apri Safari e vai su milanocab.lovable.app");
  addStep(2, "Tocca l'icona Condividi in basso (quadrato con freccia)");
  addStep(3, 'Scorri e tocca "Aggiungi alla schermata Home"');
  
  y += 5;

  // Android instructions
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Android (Chrome)", margin + 10, y);
  y += 8;

  addStep(1, "Apri Chrome e vai su milanocab.lovable.app");
  addStep(2, "Tocca i 3 puntini in alto a destra");
  addStep(3, 'Seleziona "Installa app" o "Aggiungi a schermata Home"');
  
  y += 15;

  // Section 2: Login
  addSectionHeader(2, "Accedi con il tuo numero");
  
  doc.setTextColor(...mutedColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("L'accesso e' semplice e veloce. Basta inserire il tuo numero di telefono autorizzato.", margin + 10, y);
  y += 10;

  addStep(1, "Apri l'app Milano Cab dalla Home");
  addStep(2, "Inserisci il tuo numero (es: +39 333 1234567)");
  addStep(3, 'Premi "Accedi"');
  
  // Warning note
  y += 5;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin + 10, y - 3, pageWidth - margin * 2 - 10, 15, 3, 3, "F");
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(9);
  const noteText = doc.splitTextToSize(
    "Nota: Il tuo numero deve essere stato preventivamente autorizzato. Se non riesci ad accedere, contattaci.",
    pageWidth - margin * 2 - 20
  );
  doc.text(noteText, margin + 15, y + 5);
  y += 20;

  // Section 3: Book
  addSectionHeader(3, "Prenota una corsa");
  
  doc.setTextColor(...mutedColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Prenotare una corsa e' questione di secondi:", margin + 10, y);
  y += 10;

  addStep(1, "Inserisci il punto di partenza (indirizzo o posizione attuale)");
  addStep(2, "Inserisci la destinazione");
  addStep(3, 'Scegli data e ora ("Adesso" o programma)');
  addStep(4, "Seleziona il veicolo tra le opzioni disponibili");
  addStep(5, 'Verifica i dettagli e premi "Richiedi Corsa"');
  
  y += 10;

  // Section 4: Confirmation
  addSectionHeader(4, "Ricevi la conferma");
  
  doc.setTextColor(...mutedColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Dopo aver richiesto la corsa:", margin + 10, y);
  y += 8;

  doc.setTextColor(34, 197, 94);
  doc.setFontSize(10);
  doc.text("✓", margin + 10, y);
  doc.setTextColor(...textColor);
  doc.text("Vedrai subito la stima del prezzo", margin + 18, y);
  y += 8;

  doc.setTextColor(34, 197, 94);
  doc.text("✓", margin + 10, y);
  doc.setTextColor(...textColor);
  doc.text("Riceverai una conferma con tutti i dettagli", margin + 18, y);
  y += 8;

  doc.setTextColor(34, 197, 94);
  doc.text("✓", margin + 10, y);
  doc.setTextColor(...textColor);
  doc.text("L'autista verra' notificato automaticamente", margin + 18, y);
  y += 20;

  // URL Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 3, 3, "F");
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(14);
  doc.setFont("courier", "bold");
  doc.text("milanocab.lovable.app", pageWidth / 2, y + 13, { align: "center" });

  // Footer
  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Milano Cab - Prenota corse in pochi secondi", pageWidth / 2, pageHeight - 15, { align: "center" });

  // Save the PDF
  doc.save("Milano-Cab-Guida-Utente.pdf");
}
