const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function ensureUser(usersCol, email, name, password, role) {
  let user = await usersCol.findOne({ email });
  if (user) {
    await usersCol.updateOne({ _id: user._id }, { $set: { isActive: true, isEmailVerified: true } });
    return user;
  }
  const hash = await bcrypt.hash(password, 12);
  const r = await usersCol.insertOne({
    name, email, password: hash, role,
    isActive: true, isEmailVerified: true,
    refreshTokens: [], phone: '',
    createdAt: new Date(), updatedAt: new Date(),
  });
  user = await usersCol.findOne({ _id: r.insertedId });
  return user;
}

module.exports = async function seed() {
  const db = mongoose.connection.db;
  const usersCol = db.collection('users');
  const postsCol = db.collection('posts');

  const admin   = await ensureUser(usersCol, 'feryelguehis86@gmail.com', 'feryel', 'Admin123!!', 'admin');
  const ahmed   = await ensureUser(usersCol, 'feryel@gmail.com', 'feryel', 'User123!!', 'user');
  const sarra   = await ensureUser(usersCol, 'sarra@example.com', 'Sarra Mejri', 'User1234!', 'user');
  const mohamed = await ensureUser(usersCol, 'mohamed@example.com', 'Mohamed Ali Fakhfakh', 'User1234!', 'user');

  const existingTitles = new Set(await postsCol.distinct('title'));

  const adminEmail = 'feryelguehis86@gmail.com';

  const allPosts = [
    { type: 'lost', objectType: 'telephone', title: 'iPhone 13 perdu au Lac 2', description: 'iPhone 13 bleu, coque transparente. Perdu près du complexe Les Berges du Lac.', city: 'Tunis', delegation: 'Lac 2', date: new Date('2026-07-15'), status: 'active', author: admin._id, contactEmail: adminEmail, contactPhone: '+216 99 123 456', contactPreferences: { phone: true, email: true, platform: true }, maskedDocNumber: null, reward: null, createdAt: new Date(), updatedAt: new Date() },
    { type: 'found', objectType: 'cin', title: "Carte d'identité trouvée à l'Ariana", description: 'CIN trouvé près du marché municipal.', city: 'Ariana', delegation: '', date: new Date('2026-07-18'), status: 'active', author: ahmed._id, contactEmail: 'feryel@gmail.com', contactPhone: '+216 98 111 222', contactPreferences: { phone: true, email: false, platform: true }, maskedDocNumber: '****1234', reward: null, createdAt: new Date(), updatedAt: new Date() },
    { type: 'lost', objectType: 'cles', title: 'Trousseau de clés perdu à Sousse', description: 'Trousseau avec 3 clés et un porte-clés rouge. Perdu sur la plage de Bou Jaafar.', city: 'Sousse', delegation: 'Bou Jaafar', date: new Date('2026-07-20'), status: 'active', author: sarra._id, contactEmail: 'sarra@example.com', contactPhone: '+216 55 333 444', contactPreferences: { phone: true, email: true, platform: false }, maskedDocNumber: null, reward: 50, createdAt: new Date(), updatedAt: new Date() },
    { type: 'found', objectType: 'carte_bancaire', title: 'Carte bancaire trouvée à Tunis Centre', description: 'Carte BIAT trouvée devant Monoprix.', city: 'Tunis', delegation: 'Centre Ville', date: new Date('2026-07-22'), status: 'active', author: mohamed._id, contactEmail: 'mohamed@example.com', contactPhone: '+216 22 555 666', contactPreferences: { phone: true, email: false, platform: true }, maskedDocNumber: '****5678', reward: null, createdAt: new Date(), updatedAt: new Date() },
    { type: 'lost', objectType: 'permis', title: 'Permis de conduire perdu à Nabeul', description: 'Permis perdu dans la région de Dar Chaâbane.', city: 'Nabeul', delegation: 'Dar Chaâbane', date: new Date('2026-07-23'), status: 'active', author: ahmed._id, contactEmail: 'feryel@gmail.com', contactPhone: '+216 98 111 222', contactPreferences: { phone: true, email: true, platform: true }, maskedDocNumber: '****9012', reward: 30, createdAt: new Date(), updatedAt: new Date() },
    { type: 'found', objectType: 'telephone', title: 'Samsung Galaxy trouvé au Bardo', description: 'Samsung Galaxy S23 noir trouvé dans le hall du musée du Bardo.', city: 'Tunis', delegation: 'Le Bardo', date: new Date('2026-07-24'), status: 'active', author: sarra._id, contactEmail: 'sarra@example.com', contactPhone: '+216 55 333 444', contactPreferences: { phone: false, email: true, platform: true }, maskedDocNumber: null, reward: null, createdAt: new Date(), updatedAt: new Date() },
    { type: 'lost', objectType: 'passport', title: "Passeport perdu à l'aéroport Tunis Carthage", description: 'Passeport tunisien perdu au hall des départs.', city: 'Tunis', delegation: 'Aéroport', date: new Date('2026-07-25'), status: 'active', author: mohamed._id, contactEmail: 'mohamed@example.com', contactPhone: '+216 22 555 666', contactPreferences: { phone: true, email: true, platform: true }, maskedDocNumber: '****3456', reward: 100, createdAt: new Date(), updatedAt: new Date() },
    { type: 'found', objectType: 'autre', title: 'Sac à dos trouvé au parc Belvédère', description: 'Sac à dos noir avec PC portable trouvé sur un banc.', city: 'Tunis', delegation: 'Belvédère', date: new Date('2026-07-26'), status: 'active', author: admin._id, contactEmail: adminEmail, contactPhone: '+216 99 123 456', contactPreferences: { phone: true, email: true, platform: true }, maskedDocNumber: null, reward: null, createdAt: new Date(), updatedAt: new Date() },

    { type: 'lost', objectType: 'telephone', title: 'iPhone 14 perdu à la Marsa', description: 'iPhone 14 violet avec coque en silicone rose. Perdu au café Cosy, avenue Habib Bourguiba.', city: 'Tunis', delegation: 'La Marsa', date: new Date('2026-07-19'), status: 'active', author: ahmed._id, contactEmail: 'feryel@gmail.com', contactPhone: '+216 98 111 222', contactPreferences: { phone: true, email: true, platform: true }, maskedDocNumber: null, reward: 150, createdAt: new Date(), updatedAt: new Date() },
    { type: 'found', objectType: 'portefeuille', title: 'Portefeuille trouvé à Sfax', description: 'Portefeuille en cuir marron contenant des documents et un peu d\'argent. Trouvé rue Habib Thameur.', city: 'Sfax', delegation: 'Centre', date: new Date('2026-07-21'), status: 'active', author: sarra._id, contactEmail: 'sarra@example.com', contactPhone: '+216 55 333 444', contactPreferences: { phone: true, email: false, platform: true }, maskedDocNumber: null, reward: null, createdAt: new Date(), updatedAt: new Date() },
    { type: 'lost', objectType: 'lunettes', title: 'Lunettes de vue perdues à Bizerte', description: 'Lunettes de vue monture noire Ray-Ban. Perdues sur la plage de la Grotte.', city: 'Bizerte', delegation: 'Plage', date: new Date('2026-07-22'), status: 'active', author: mohamed._id, contactEmail: 'mohamed@example.com', contactPhone: '+216 22 555 666', contactPreferences: { phone: true, email: true, platform: false }, maskedDocNumber: null, reward: 80, createdAt: new Date(), updatedAt: new Date() },
    { type: 'found', objectType: 'sac', title: 'Sac à main trouvé à Hammamet', description: 'Sac à main femme, marque Guess, couleur beige. Trouvé à l\'entrée du centre commercial.', city: 'Nabeul', delegation: 'Hammamet', date: new Date('2026-07-23'), status: 'active', author: admin._id, contactEmail: adminEmail, contactPhone: '+216 99 123 456', contactPreferences: { phone: true, email: true, platform: true }, maskedDocNumber: null, reward: null, createdAt: new Date(), updatedAt: new Date() },
    { type: 'lost', objectType: 'tablette', title: 'iPad perdu dans le train Banlieue Sud', description: 'iPad Air 5e génération, gris sidéral, avec un clavier Logitech attaché. Perdu dans le train entre Tunis et Borj Cédria.', city: 'Tunis', delegation: 'Banlieue Sud', date: new Date('2026-07-24'), status: 'active', author: ahmed._id, contactEmail: 'feryel@gmail.com', contactPhone: '+216 98 111 222', contactPreferences: { phone: false, email: true, platform: true }, maskedDocNumber: null, reward: 200, createdAt: new Date(), updatedAt: new Date() },
    { type: 'found', objectType: 'montre', title: 'Montre connectée trouvée au stade de Radès', description: 'Montre connectée Samsung Galaxy Watch noire. Trouvée dans les tribunes après le match.', city: 'Ben Arous', delegation: 'Radès', date: new Date('2026-07-25'), status: 'active', author: sarra._id, contactEmail: 'sarra@example.com', contactPhone: '+216 55 333 444', contactPreferences: { phone: true, email: true, platform: true }, maskedDocNumber: null, reward: null, createdAt: new Date(), updatedAt: new Date() },
    { type: 'lost', objectType: 'carte_etudiante', title: 'Carte étudiante perdue à l\'Université de la Manouba', description: 'Carte d\'étudiant FSEG La Manouba, numéro 2024/12345. Perdue dans le bâtiment B.', city: 'Manouba', delegation: 'La Manouba', date: new Date('2026-07-26'), status: 'active', author: mohamed._id, contactEmail: 'mohamed@example.com', contactPhone: '+216 22 555 666', contactPreferences: { phone: true, email: true, platform: true }, maskedDocNumber: '****5678', reward: null, createdAt: new Date(), updatedAt: new Date() },
    { type: 'found', objectType: 'appareil_photo', title: 'Appareil photo trouvé à Kairouan', description: 'Canon EOS 2000D avec objectif 18-55mm. Trouvé près de la mosquée Okba Ibn Nafaa.', city: 'Kairouan', delegation: 'Médina', date: new Date('2026-07-27'), status: 'active', author: admin._id, contactEmail: adminEmail, contactPhone: '+216 99 123 456', contactPreferences: { phone: true, email: false, platform: true }, maskedDocNumber: null, reward: null, createdAt: new Date(), updatedAt: new Date() },
    { type: 'lost', objectType: 'ecouteurs', title: 'AirPods Pro perdus au métro Tunis', description: 'AirPods Pro 2e génération avec étui de charge MagSafe. Perdus dans la station de métro Place Barcelone.', city: 'Tunis', delegation: 'Centre Ville', date: new Date('2026-07-27'), status: 'active', author: sarra._id, contactEmail: 'sarra@example.com', contactPhone: '+216 55 333 444', contactPreferences: { phone: false, email: true, platform: false }, maskedDocNumber: null, reward: 60, createdAt: new Date(), updatedAt: new Date() },
    { type: 'found', objectType: 'bijou', title: 'Bague en argent trouvée à Sousse', description: 'Bague en argent avec une pierre turquoise. Trouvée sur la plage de Port El Kantaoui.', city: 'Sousse', delegation: 'Port El Kantaoui', date: new Date('2026-07-28'), status: 'active', author: ahmed._id, contactEmail: 'feryel@gmail.com', contactPhone: '+216 98 111 222', contactPreferences: { phone: true, email: true, platform: true }, maskedDocNumber: null, reward: null, createdAt: new Date(), updatedAt: new Date() },
    { type: 'lost', objectType: 'animal', title: 'Chat perdu à l\'Ariana', description: 'Chat de gouttière roux, collier rouge avec médaille. Vu pour la dernière fois rue des Jardins.', city: 'Ariana', delegation: 'Ezzahra', date: new Date('2026-07-28'), status: 'active', author: mohamed._id, contactEmail: 'mohamed@example.com', contactPhone: '+216 22 555 666', contactPreferences: { phone: true, email: true, platform: true }, maskedDocNumber: null, reward: 100, createdAt: new Date(), updatedAt: new Date() },
    { type: 'found', objectType: 'instrument_musique', title: 'Guitare trouvée à Monastir', description: 'Guitare acoustique Yamaha couleur naturelle. Trouvée dans un taxi à Monastir.', city: 'Monastir', delegation: 'Centre', date: new Date('2026-07-29'), status: 'active', author: sarra._id, contactEmail: 'sarra@example.com', contactPhone: '+216 55 333 444', contactPreferences: { phone: true, email: false, platform: true }, maskedDocNumber: null, reward: null, createdAt: new Date(), updatedAt: new Date() },
    { type: 'lost', objectType: 'bagage', title: 'Valise perdue à l\'aéroport Enfidha', description: 'Valise cabine Samsonite rouge, roulettes 4 directions. Perdue au hall des arrivées.', city: 'Sousse', delegation: 'Enfidha', date: new Date('2026-07-29'), status: 'active', author: admin._id, contactEmail: adminEmail, contactPhone: '+216 99 123 456', contactPreferences: { phone: true, email: true, platform: true }, maskedDocNumber: null, reward: 50, createdAt: new Date(), updatedAt: new Date() },
    { type: 'found', objectType: 'ordinateur', title: 'PC portable trouvé à Gabès', description: 'HP Pavilion 15 noir, trouvé dans un café du centre-ville de Gabès.', city: 'Gabès', delegation: 'Ville', date: new Date('2026-07-30'), status: 'active', author: ahmed._id, contactEmail: 'feryel@gmail.com', contactPhone: '+216 98 111 222', contactPreferences: { phone: true, email: true, platform: true }, maskedDocNumber: null, reward: null, createdAt: new Date(), updatedAt: new Date() },
  ];

  const newPosts = allPosts.filter(p => !existingTitles.has(p.title));
  if (newPosts.length > 0) {
    await postsCol.insertMany(newPosts);
  }
};
