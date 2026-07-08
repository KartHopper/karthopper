interface LegalSection {
  heading: string;
  body: string;
}

interface LegalContent {
  title: string;
  sections: LegalSection[];
}

export const legalNotice: LegalContent = {
  title: "Legal notice",
  sections: [
    {
      heading: "Publisher",
      body: "KartHopper is published by [PUBLISHER — TO BE COMPLETED]. Contact: [CONTACT E-MAIL — TO BE COMPLETED].",
    },
    {
      heading: "Host",
      body: "Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.",
    },
    {
      heading: "Data source",
      body: "Race and track data comes from the Sodi World Series website (sodiwseries.com) and is displayed with attribution. KartHopper is not affiliated with Sodi World Series.",
    },
    {
      heading: "Map tiles",
      body: "© MapTiler © OpenStreetMap contributors.",
    },
  ],
};

export const privacy: LegalContent = {
  title: "Privacy",
  sections: [
    {
      heading: "No data sent to a KartHopper server",
      body: "KartHopper has no user accounts or server-side database in version 1. Your position and starting city stay in your browser only (localStorage), never sent to a KartHopper server.",
    },
    {
      heading: "Karthopping passport",
      body: "Tracks you mark as visited are stored in your browser's localStorage. You can clear them anytime (by clearing the site's data in your browser) or export/import them via a JSON file.",
    },
    {
      heading: "City search",
      body: "Typing a city in the filters queries the public Photon API (komoot.io) with the text you enter, to suggest location matches.",
    },
    {
      heading: "Cookies and trackers",
      body: "No third-party cookies, no advertising or analytics trackers are used.",
    },
    {
      heading: "Technical logs",
      body: "The host (Vercel) keeps technical logs (IP address, requests) for security purposes for about 30 days.",
    },
    {
      heading: "Your rights",
      body: "Under GDPR, you have the right to access, rectify and delete data concerning you. Contact us at [CONTACT E-MAIL — TO BE COMPLETED].",
    },
  ],
};
