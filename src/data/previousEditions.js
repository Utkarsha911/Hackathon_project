// Older hackathon editions shown on the History page (/previous-hackathons).
//
// The newest edition (V4.0) is loaded from the backend API, so it is NOT listed here.
// To add an edition by hand, add ONE object to this array (newest first).
// Images go in the /public folder: "/images/history/v3.jpg" means
// public/images/history/v3.jpg.
//
// Fields:
//   id          unique text
//   version     label shown on the card, e.g. "V3.0"
//   title       card heading
//   image       photo path (inside /public)
//   date        text shown next to the calendar icon
//   location    text shown next to the map pin icon
//   teamSize    text shown next to the people icon
//   highlight   optional extra line (e.g. prize), shown next to the trophy icon
//   description optional short paragraph

export const PREVIOUS_EDITIONS = [
  {
    id: 'v3',
    version: 'V3.0',
    title: 'Demo Day Winners', // TODO: confirm the official V3.0 title
    image: '/images/history/v3.jpg',
    date: 'TODO: add date',
    location: 'TODO: add location',
    teamSize: 'TODO: add team size',
    description: 'The winning teams on demo day.',
  },
  {
    id: 'v2',
    version: 'V2.0',
    title: 'Night Camp & Bonfire', // TODO: confirm the official V2.0 title
    image: '/images/history/v2.jpg',
    date: 'TODO: add date',
    location: 'TODO: add location',
    teamSize: 'TODO: add team size',
    description: 'Hacking through the night, with a bonfire to keep the teams going.',
  },
  {
    id: 'v1',
    version: 'V1.0',
    title: 'The First Edition', // TODO: confirm the official V1.0 title
    image: '/images/history/v1.jpg',
    date: 'Nov 20, 2021',
    location: 'TODO: add location',
    teamSize: 'TODO: add team size',
    highlight: 'Prize: NRs. 20,000',
    description: 'Where it all started.',
  },
];

// The backend currently returns the wrong version label for the newest edition.
// This map fixes the label on the page. Once the value is corrected in the
// backend admin, this entry can be removed.
export const VERSION_LABEL_FIXES = {
  'v.5': 'V4.0',
};
