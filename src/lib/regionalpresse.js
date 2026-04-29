// Regionalpresse-RSS-Feeds nach Bundesland
// Quellen: Mantelblätter, Heimatzeitungen, regionale Online-Medien — alle mit RSS-Feed
// Format: { name, rss, scope?: 'land'|'region'|'lokal', orte?: [Filter] }
//
// Verwendung: pickFeeds(ort, bundesland) liefert priorisiert relevante Feeds zurück

export const REGIONAL_PRESSE = {
  'Baden-Württemberg': [
    { name: 'Stuttgarter Zeitung', rss: 'https://www.stuttgarter-zeitung.de/news.feed', scope: 'land' },
    { name: 'Stuttgarter Nachrichten', rss: 'https://www.stuttgarter-nachrichten.de/news.feed', scope: 'land' },
    { name: 'Schwarzwälder Bote', rss: 'https://www.schwarzwaelder-bote.de/news.feed', scope: 'region', orte: ['villingen', 'schwenningen', 'rottweil', 'oberndorf', 'horb', 'freudenstadt', 'calw', 'nagold', 'balingen', 'tuttlingen'] },
    { name: 'Südkurier', rss: 'https://www.suedkurier.de/storage/rss/rss/ueberregional.xml', scope: 'region', orte: ['konstanz', 'singen', 'villingen', 'schwenningen', 'tuttlingen', 'überlingen', 'friedrichshafen', 'ravensburg', 'wangen'] },
    { name: 'Badische Zeitung', rss: 'https://www.badische-zeitung.de/rss/feeds/rss-aktuell.xml', scope: 'region', orte: ['freiburg', 'lörrach', 'müllheim', 'offenburg', 'emmendingen', 'waldshut'] },
    { name: 'Rhein-Neckar-Zeitung', rss: 'https://www.rnz.de/rss/feed/rnz_topnews', scope: 'region', orte: ['heidelberg', 'mannheim', 'eppelheim', 'leimen', 'wiesloch', 'sinsheim', 'mosbach', 'neckargemünd', 'walldorf'] },
    { name: 'Mannheimer Morgen', rss: 'https://www.mannheimer-morgen.de/feed/rss/', scope: 'region', orte: ['mannheim', 'heidelberg', 'weinheim', 'schwetzingen', 'hockenheim'] },
    { name: 'Heilbronner Stimme', rss: 'https://www.stimme.de/rss/aktuell.xml', scope: 'region', orte: ['heilbronn', 'neckarsulm', 'eppingen', 'öhringen', 'künzelsau'] },
    { name: 'Pforzheimer Zeitung', rss: 'https://www.pz-news.de/rss/aktuell.xml', scope: 'region', orte: ['pforzheim', 'mühlacker', 'bretten', 'birkenfeld'] },
    { name: 'Schwäbisches Tagblatt', rss: 'https://www.tagblatt.de/rss', scope: 'region', orte: ['tübingen', 'rottenburg', 'mössingen', 'horb'] },
    { name: 'Reutlinger General-Anzeiger', rss: 'https://www.gea.de/rss', scope: 'region', orte: ['reutlingen', 'metzingen', 'pfullingen', 'bad urach'] },
    { name: 'Schwäbische Zeitung', rss: 'https://www.schwaebische.de/rss', scope: 'region', orte: ['ravensburg', 'friedrichshafen', 'biberach', 'sigmaringen', 'leutkirch', 'wangen', 'aulendorf', 'ehingen', 'ulm'] },
    { name: 'Südwest Presse Ulm', rss: 'https://www.swp.de/rss/swp.xml', scope: 'region', orte: ['ulm', 'göppingen', 'aalen', 'ehingen', 'biberach', 'heidenheim'] },
    { name: 'Eßlinger Zeitung', rss: 'https://www.esslinger-zeitung.de/rss/aktuell.xml', scope: 'region', orte: ['esslingen', 'plochingen', 'kirchheim', 'nürtingen'] },
    { name: 'Ludwigsburger Kreiszeitung', rss: 'https://www.lkz.de/rss/aktuell.xml', scope: 'region', orte: ['ludwigsburg', 'bietigheim', 'kornwestheim', 'remseck'] },
    { name: 'Badische Neueste Nachrichten', rss: 'https://bnn.de/feed', scope: 'region', orte: ['karlsruhe', 'rastatt', 'bruchsal', 'bühl', 'pforzheim'] },
  ],
  'Bayern': [
    { name: 'Süddeutsche Zeitung (Bayern)', rss: 'https://rss.sueddeutsche.de/rss/Bayern', scope: 'land' },
    { name: 'Münchner Merkur', rss: 'https://www.merkur.de/feed/rss2-0/index.rss', scope: 'land' },
    { name: 'Münchner Abendzeitung', rss: 'https://www.abendzeitung-muenchen.de/rss', scope: 'lokal', orte: ['münchen'] },
    { name: 'Nürnberger Nachrichten', rss: 'https://www.nordbayern.de/rss', scope: 'region', orte: ['nürnberg', 'fürth', 'erlangen', 'schwabach', 'roth', 'forchheim', 'lauf'] },
    { name: 'Augsburger Allgemeine', rss: 'https://www.augsburger-allgemeine.de/rss/rss-1', scope: 'region', orte: ['augsburg', 'donauwörth', 'aichach', 'friedberg', 'memmingen', 'kempten', 'landsberg'] },
    { name: 'Mittelbayerische Zeitung', rss: 'https://www.mittelbayerische.de/rss/Top-Themen.feed', scope: 'region', orte: ['regensburg', 'kelheim', 'cham', 'schwandorf'] },
    { name: 'Passauer Neue Presse', rss: 'https://www.pnp.de/rss/welt-und-bayern.xml', scope: 'region', orte: ['passau', 'deggendorf', 'plattling', 'freyung', 'vilshofen'] },
    { name: 'Donaukurier', rss: 'https://www.donaukurier.de/rss/aktuell.xml', scope: 'region', orte: ['ingolstadt', 'eichstätt', 'pfaffenhofen', 'neuburg'] },
    { name: 'Frankenpost', rss: 'https://www.frankenpost.de/rss/news/', scope: 'region', orte: ['hof', 'kulmbach', 'bayreuth', 'marktredwitz', 'selb'] },
    { name: 'Mainpost', rss: 'https://www.mainpost.de/rss/feed/mp_inhalte_aktuell', scope: 'region', orte: ['würzburg', 'schweinfurt', 'kitzingen', 'aschaffenburg'] },
  ],
  'Berlin': [
    { name: 'Tagesspiegel', rss: 'https://www.tagesspiegel.de/contentexport/feed/home', scope: 'land' },
    { name: 'Berliner Morgenpost', rss: 'https://www.morgenpost.de/berlin/rss', scope: 'land' },
    { name: 'Berliner Zeitung', rss: 'https://www.berliner-zeitung.de/feed.xml', scope: 'land' },
    { name: 'B.Z.', rss: 'https://www.bz-berlin.de/feed', scope: 'land' },
  ],
  'Brandenburg': [
    { name: 'Märkische Allgemeine', rss: 'https://www.maz-online.de/arc/outboundfeeds/rss/category/lokales/', scope: 'land' },
    { name: 'Märkische Oderzeitung', rss: 'https://www.moz.de/rss/feed/moz_top', scope: 'region', orte: ['frankfurt', 'eberswalde', 'bernau', 'strausberg', 'fürstenwalde'] },
    { name: 'Lausitzer Rundschau', rss: 'https://www.lr-online.de/rss', scope: 'region', orte: ['cottbus', 'senftenberg', 'forst', 'spremberg', 'lübben'] },
    { name: 'Potsdamer Neueste Nachrichten', rss: 'https://www.pnn.de/contentexport/feed/home', scope: 'lokal', orte: ['potsdam'] },
  ],
  'Bremen': [
    { name: 'Weser-Kurier', rss: 'https://www.weser-kurier.de/feed/rss/themen-aktuell', scope: 'land' },
  ],
  'Hamburg': [
    { name: 'Hamburger Abendblatt', rss: 'https://www.abendblatt.de/hamburg/rss', scope: 'land' },
    { name: 'Hamburger Morgenpost', rss: 'https://www.mopo.de/feed', scope: 'land' },
    { name: 'NDR Hamburg', rss: 'https://www.ndr.de/nachrichten/hamburg/index-rss.xml', scope: 'land' },
  ],
  'Hessen': [
    { name: 'Frankfurter Allgemeine Rhein-Main', rss: 'https://www.faz.net/rss/aktuell/rhein-main/', scope: 'region', orte: ['frankfurt', 'offenbach', 'darmstadt', 'wiesbaden', 'rüsselsheim', 'hanau'] },
    { name: 'Frankfurter Rundschau', rss: 'https://www.fr.de/rssfeed.rdf', scope: 'land' },
    { name: 'Wiesbadener Kurier', rss: 'https://www.wiesbadener-kurier.de/rss', scope: 'region', orte: ['wiesbaden', 'rüdesheim', 'eltville', 'mainz'] },
    { name: 'Darmstädter Echo', rss: 'https://www.echo-online.de/rss/aktuell.xml', scope: 'region', orte: ['darmstadt', 'dieburg', 'gross-gerau', 'rüsselsheim'] },
    { name: 'Hessische/Niedersächsische Allgemeine', rss: 'https://www.hna.de/feed/rss2-0/index.rss', scope: 'region', orte: ['kassel', 'göttingen', 'hofgeismar', 'fritzlar', 'baunatal'] },
    { name: 'Gießener Allgemeine', rss: 'https://www.giessener-allgemeine.de/rssfeed.rdf', scope: 'region', orte: ['gießen', 'wetzlar', 'marburg', 'lich'] },
  ],
  'Mecklenburg-Vorpommern': [
    { name: 'Ostsee-Zeitung', rss: 'https://www.ostsee-zeitung.de/api/rss', scope: 'land' },
    { name: 'Schweriner Volkszeitung', rss: 'https://www.svz.de/news.rss', scope: 'land' },
    { name: 'Nordkurier', rss: 'https://www.nordkurier.de/rss/aktuelle-meldungen.xml', scope: 'region', orte: ['neubrandenburg', 'demmin', 'waren', 'pasewalk', 'anklam'] },
  ],
  'Niedersachsen': [
    { name: 'Hannoversche Allgemeine', rss: 'https://www.haz.de/arc/outboundfeeds/rss/section/Hannover/', scope: 'region', orte: ['hannover', 'laatzen', 'garbsen', 'langenhagen', 'lehrte'] },
    { name: 'Neue Presse Hannover', rss: 'https://www.neuepresse.de/arc/outboundfeeds/rss/category/Hannover/', scope: 'region', orte: ['hannover', 'lehrte', 'laatzen', 'garbsen'] },
    { name: 'Nordwest-Zeitung', rss: 'https://www.nwzonline.de/rss/feed.xml', scope: 'region', orte: ['oldenburg', 'wilhelmshaven', 'leer', 'jever', 'cloppenburg', 'vechta'] },
    { name: 'Ostfriesen-Zeitung', rss: 'https://www.oz-online.de/rss/feed.xml', scope: 'region', orte: ['emden', 'leer', 'aurich', 'wilhelmshaven', 'norden'] },
    { name: 'Braunschweiger Zeitung', rss: 'https://www.braunschweiger-zeitung.de/rss', scope: 'region', orte: ['braunschweig', 'wolfsburg', 'salzgitter', 'helmstedt', 'wolfenbüttel'] },
    { name: 'Göttinger Tageblatt', rss: 'https://www.goettinger-tageblatt.de/arc/outboundfeeds/rss/category/Goettingen/', scope: 'region', orte: ['göttingen', 'hann. münden', 'duderstadt', 'osterode'] },
    { name: 'Neue Osnabrücker Zeitung', rss: 'https://www.noz.de/rss/aktuell.xml', scope: 'region', orte: ['osnabrück', 'lingen', 'meppen', 'nordhorn', 'papenburg'] },
  ],
  'Nordrhein-Westfalen': [
    { name: 'WAZ', rss: 'https://www.waz.de/rss', scope: 'region', orte: ['essen', 'duisburg', 'oberhausen', 'mülheim', 'bottrop', 'gelsenkirchen', 'bochum'] },
    { name: 'Rheinische Post', rss: 'https://rp-online.de/feed.rss', scope: 'land' },
    { name: 'Westfälische Rundschau', rss: 'https://www.wr.de/rss', scope: 'region', orte: ['dortmund', 'lünen', 'iserlohn', 'hagen'] },
    { name: 'WDR Lokalzeit', rss: 'https://www1.wdr.de/uebersicht-rss-100.xml', scope: 'land' },
    { name: 'Kölner Stadt-Anzeiger', rss: 'https://www.ksta.de/feed/index.rss', scope: 'region', orte: ['köln', 'leverkusen', 'bergisch gladbach', 'frechen', 'hürth', 'pulheim', 'bonn'] },
    { name: 'Aachener Zeitung', rss: 'https://www.aachener-zeitung.de/rss', scope: 'region', orte: ['aachen', 'düren', 'eschweiler', 'stolberg', 'jülich', 'heinsberg'] },
    { name: 'General-Anzeiger Bonn', rss: 'https://www.general-anzeiger-bonn.de/rss/feed.xml', scope: 'region', orte: ['bonn', 'siegburg', 'troisdorf', 'königswinter', 'bad honnef', 'remagen'] },
    { name: 'Westfälische Nachrichten', rss: 'https://www.wn.de/rss/feed/wn_topnews', scope: 'region', orte: ['münster', 'gronau', 'rheine', 'coesfeld', 'borken'] },
    { name: 'Westfalen-Blatt', rss: 'https://www.westfalen-blatt.de/rss', scope: 'region', orte: ['bielefeld', 'paderborn', 'gütersloh', 'minden', 'detmold', 'herford'] },
    { name: 'Neue Westfälische', rss: 'https://www.nw.de/rss/feed/nw_topnews', scope: 'region', orte: ['bielefeld', 'gütersloh', 'detmold', 'herford', 'lemgo', 'paderborn'] },
    { name: 'Siegener Zeitung', rss: 'https://www.siegener-zeitung.de/rss', scope: 'region', orte: ['siegen', 'kreuztal', 'olpe', 'wilnsdorf'] },
    { name: 'Ruhr Nachrichten', rss: 'https://www.ruhrnachrichten.de/rss', scope: 'region', orte: ['dortmund', 'lünen', 'castrop-rauxel', 'unna', 'kamen'] },
  ],
  'Rheinland-Pfalz': [
    { name: 'Rhein-Zeitung', rss: 'https://www.rhein-zeitung.de/rss/news', scope: 'region', orte: ['koblenz', 'andernach', 'mayen', 'neuwied', 'bad neuenahr', 'cochem'] },
    { name: 'Allgemeine Zeitung Mainz', rss: 'https://www.allgemeine-zeitung.de/rss', scope: 'region', orte: ['mainz', 'bingen', 'ingelheim', 'oppenheim', 'alzey'] },
    { name: 'Trierischer Volksfreund', rss: 'https://www.volksfreund.de/rss/feed', scope: 'region', orte: ['trier', 'wittlich', 'bitburg', 'saarburg', 'konz'] },
    { name: 'Rheinpfalz', rss: 'https://www.rheinpfalz.de/rss/aktuell.xml', scope: 'region', orte: ['ludwigshafen', 'kaiserslautern', 'pirmasens', 'speyer', 'frankenthal', 'landau', 'neustadt'] },
  ],
  'Saarland': [
    { name: 'Saarbrücker Zeitung', rss: 'https://www.saarbruecker-zeitung.de/rss', scope: 'land' },
    { name: 'Saarland-Welle SR', rss: 'https://www.sr.de/sr/home/nachrichten/index~rss.xml', scope: 'land' },
  ],
  'Sachsen': [
    { name: 'Sächsische Zeitung', rss: 'https://www.saechsische.de/rss', scope: 'region', orte: ['dresden', 'pirna', 'meißen', 'bautzen', 'görlitz', 'zittau'] },
    { name: 'Leipziger Volkszeitung', rss: 'https://www.lvz.de/arc/outboundfeeds/rss/category/Leipzig/', scope: 'region', orte: ['leipzig', 'borna', 'grimma', 'oschatz', 'wurzen'] },
    { name: 'Freie Presse', rss: 'https://www.freiepresse.de/rss/feed/start', scope: 'region', orte: ['chemnitz', 'zwickau', 'plauen', 'mittweida', 'auerbach'] },
  ],
  'Sachsen-Anhalt': [
    { name: 'Mitteldeutsche Zeitung', rss: 'https://www.mz.de/rss/feed/mz_topnews', scope: 'region', orte: ['halle', 'köthen', 'eisleben', 'merseburg', 'naumburg'] },
    { name: 'Volksstimme', rss: 'https://www.volksstimme.de/rss/feed/vs_topnews', scope: 'region', orte: ['magdeburg', 'stendal', 'salzwedel', 'haldensleben', 'wernigerode'] },
  ],
  'Schleswig-Holstein': [
    { name: 'Kieler Nachrichten', rss: 'https://www.kn-online.de/arc/outboundfeeds/rss/category/Kiel/', scope: 'region', orte: ['kiel', 'plön', 'preetz', 'rendsburg'] },
    { name: 'Lübecker Nachrichten', rss: 'https://www.ln-online.de/arc/outboundfeeds/rss/category/Luebeck/', scope: 'region', orte: ['lübeck', 'bad schwartau', 'eutin', 'oldenburg'] },
    { name: 'Schleswig-Holsteinischer Zeitungsverlag (shz)', rss: 'https://www.shz.de/rss', scope: 'region', orte: ['flensburg', 'schleswig', 'husum', 'rendsburg', 'neumünster'] },
    { name: 'Norddeutsche Nachrichten', rss: 'https://www.nordeutsche-nachrichten.de/rss', scope: 'region', orte: ['pinneberg', 'elmshorn', 'wedel', 'tornesch'] },
  ],
  'Thüringen': [
    { name: 'Thüringer Allgemeine', rss: 'https://www.thueringer-allgemeine.de/rss', scope: 'region', orte: ['erfurt', 'weimar', 'mühlhausen', 'gotha', 'sondershausen'] },
    { name: 'Thüringische Landeszeitung', rss: 'https://www.tlz.de/rss', scope: 'land' },
    { name: 'Ostthüringer Zeitung', rss: 'https://www.otz.de/rss', scope: 'region', orte: ['gera', 'jena', 'altenburg', 'pößneck', 'rudolstadt', 'saalfeld'] },
    { name: 'Südthüringer Zeitung', rss: 'https://www.insuedthueringen.de/rss', scope: 'region', orte: ['suhl', 'meiningen', 'zella-mehlis', 'sonneberg', 'hildburghausen'] },
  ],
}

// Liefert priorisiert relevante Feeds für einen Ort
export function pickFeeds(ort, bundesland) {
  const list = REGIONAL_PRESSE[bundesland] || []
  const ortLower = (ort || '').toLowerCase().trim()
  const ortFirst = ortLower.split(/[\s\-,]/)[0]

  const lokal = list.filter(f => f.scope === 'lokal' && f.orte?.some(o => ortLower.includes(o) || o.includes(ortFirst)))
  const region = list.filter(f => f.scope === 'region' && f.orte?.some(o => ortLower.includes(o) || o.includes(ortFirst)))
  const land = list.filter(f => f.scope === 'land')

  // Wenn keine regional/lokal-Treffer: alle "land"-Feeds + alle region-Feeds des Bundeslandes als Fallback
  const result = [...lokal, ...region, ...land]
  if (result.length === 0) return list
  return result
}

// Google News RSS-Suche als universeller Fallback
export function googleNewsFeed(query) {
  const q = encodeURIComponent(query)
  return `https://news.google.com/rss/search?q=${q}&hl=de&gl=DE&ceid=DE:de`
}
