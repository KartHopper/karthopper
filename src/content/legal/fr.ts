interface LegalSection {
  heading: string;
  body: string;
}

interface LegalContent {
  title: string;
  sections: LegalSection[];
}

export const legalNotice: LegalContent = {
  title: "Mentions légales",
  sections: [
    {
      heading: "Éditeur",
      body: "KartHopper est édité par [ÉDITEUR — À COMPLÉTER]. Contact : [E-MAIL DE CONTACT — À COMPLÉTER].",
    },
    {
      heading: "Hébergeur",
      body: "Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.",
    },
    {
      heading: "Source des données",
      body: "Les données de courses et de circuits sont issues du site Sodi World Series (sodiwseries.com) et affichées avec attribution. KartHopper n'est pas affilié à Sodi World Series.",
    },
    {
      heading: "Fonds de carte",
      body: "© MapTiler © OpenStreetMap contributors.",
    },
  ],
};

export const privacy: LegalContent = {
  title: "Confidentialité",
  sections: [
    {
      heading: "Aucune donnée transmise à un serveur KartHopper",
      body: "KartHopper ne dispose d'aucun compte utilisateur ni base de données côté serveur en version 1. Ta position et ta ville de départ restent uniquement dans ton navigateur (localStorage), jamais envoyées à un serveur KartHopper.",
    },
    {
      heading: "Passeport karthopping",
      body: "Les circuits que tu marques comme visités sont stockés dans le localStorage de ton navigateur. Tu peux les effacer à tout moment (en vidant les données du site depuis ton navigateur) ou les exporter/importer via un fichier JSON.",
    },
    {
      heading: "Recherche de ville",
      body: "La saisie d'une ville dans les filtres interroge l'API publique Photon (komoot.io) avec le texte que tu tapes, pour te proposer des suggestions de localisation.",
    },
    {
      heading: "Cookies et traceurs",
      body: "Aucun cookie tiers, aucun traceur publicitaire ou analytique n'est utilisé.",
    },
    {
      heading: "Logs techniques",
      body: "L'hébergeur (Vercel) conserve des logs techniques (adresse IP, requêtes) à des fins de sécurité pendant environ 30 jours.",
    },
    {
      heading: "Tes droits",
      body: "Conformément au RGPD, tu disposes d'un droit d'accès, de rectification et de suppression des données te concernant. Contacte-nous à [E-MAIL DE CONTACT — À COMPLÉTER].",
    },
  ],
};
