/**
 * Comprehensive administrative divisions data for all countries.
 * Each country has:
 * - divisionName: The official name of administrative divisions in that country
 * - regions: Array of all first-level administrative divisions + capital (if not already included)
 */

export interface CountryAdminData {
  divisionName: string;
  regions: string[];
}

export const countryAdminDivisions: Record<string, CountryAdminData> = {
  // A
  AF: {
    divisionName: "Provinces",
    regions: ["Kabul", "Badakhshan", "Badghis", "Baghlan", "Balkh", "Bamyan", "Daykundi", "Farah", "Faryab", "Ghazni", "Ghor", "Helmand", "Herat", "Jowzjan", "Kandahar", "Kapisa", "Khost", "Kunar", "Kunduz", "Laghman", "Logar", "Nangarhar", "Nimroz", "Nuristan", "Paktia", "Paktika", "Panjshir", "Parwan", "Samangan", "Sar-e Pol", "Takhar", "Uruzgan", "Wardak", "Zabul"]
  },
  AL: {
    divisionName: "Counties",
    regions: ["Tirana", "Berat", "Dibër", "Durrës", "Elbasan", "Fier", "Gjirokastër", "Korçë", "Kukës", "Lezhë", "Shkodër", "Vlorë"]
  },
  DZ: {
    divisionName: "Provinces",
    regions: ["Algiers", "Adrar", "Aïn Defla", "Aïn Témouchent", "Annaba", "Batna", "Béchar", "Béjaïa", "Biskra", "Blida", "Bordj Bou Arréridj", "Bouira", "Boumerdès", "Chlef", "Constantine", "Djelfa", "El Bayadh", "El Oued", "El Tarf", "Ghardaïa", "Guelma", "Illizi", "Jijel", "Khenchela", "Laghouat", "Mascara", "Médéa", "Mila", "Mostaganem", "M'Sila", "Naâma", "Oran", "Ouargla", "Oum El Bouaghi", "Relizane", "Saïda", "Sétif", "Sidi Bel Abbès", "Skikda", "Souk Ahras", "Tamanrasset", "Tébessa", "Tiaret", "Tindouf", "Tipaza", "Tissemsilt", "Tizi Ouzou", "Tlemcen"]
  },
  AD: {
    divisionName: "Parishes",
    regions: ["Andorra la Vella", "Canillo", "Encamp", "Escaldes-Engordany", "La Massana", "Ordino", "Sant Julià de Lòria"]
  },
  AO: {
    divisionName: "Provinces",
    regions: ["Luanda", "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango", "Cuanza Norte", "Cuanza Sul", "Cunene", "Huambo", "Huíla", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico", "Namibe", "Uíge", "Zaire"]
  },
  AG: {
    divisionName: "Parishes",
    regions: ["St. John's", "Barbuda", "Redonda", "Saint George", "Saint John", "Saint Mary", "Saint Paul", "Saint Peter", "Saint Philip"]
  },
  AR: {
    divisionName: "Provinces",
    regions: ["Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"]
  },
  AM: {
    divisionName: "Provinces",
    regions: ["Yerevan", "Aragatsotn", "Ararat", "Armavir", "Gegharkunik", "Kotayk", "Lori", "Shirak", "Syunik", "Tavush", "Vayots Dzor"]
  },
  AU: {
    divisionName: "States/Territories",
    regions: ["Canberra (ACT)", "New South Wales", "Northern Territory", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"]
  },
  AT: {
    divisionName: "States",
    regions: ["Vienna", "Burgenland", "Carinthia", "Lower Austria", "Upper Austria", "Salzburg", "Styria", "Tyrol", "Vorarlberg"]
  },
  AZ: {
    divisionName: "Districts",
    regions: ["Baku", "Absheron", "Agdam", "Agdash", "Aghjabadi", "Agstafa", "Agsu", "Astara", "Babek", "Balakan", "Barda", "Beylagan", "Bilasuvar", "Dashkasan", "Fuzuli", "Gadabay", "Ganja", "Gobustan", "Goranboy", "Goychay", "Goygol", "Hajigabul", "Imishli", "Ismayilli", "Jabrayil", "Jalilabad", "Julfa", "Kalbajar", "Kangarli", "Khachmaz", "Khizi", "Khojaly", "Khojavend", "Kurdamir", "Lachin", "Lankaran", "Lerik", "Masally", "Mingachevir", "Naftalan", "Nakhchivan", "Neftchala", "Oghuz", "Ordubad", "Qabala", "Qakh", "Qazakh", "Qobustan", "Quba", "Qubadli", "Qusar", "Saatly", "Sabirabad", "Sadarak", "Salyan", "Samukh", "Shabran", "Shahbuz", "Shaki", "Shamakhi", "Shamkir", "Sharur", "Shirvan", "Shusha", "Siazan", "Sumgait", "Tartar", "Tovuz", "Ujar", "Yardimli", "Yevlakh", "Zangilan", "Zaqatala", "Zardab"]
  },
  // B
  BS: {
    divisionName: "Districts",
    regions: ["Nassau", "Acklins", "Berry Islands", "Bimini", "Black Point", "Cat Island", "Central Abaco", "Central Andros", "Central Eleuthera", "City of Freeport", "Crooked Island and Long Cay", "East Grand Bahama", "Exuma", "Grand Cay", "Harbour Island", "Hope Town", "Inagua", "Long Island", "Mangrove Cay", "Mayaguana", "Moore's Island", "North Abaco", "North Andros", "North Eleuthera", "Ragged Island", "Rum Cay", "San Salvador", "South Abaco", "South Andros", "South Eleuthera", "Spanish Wells", "West Grand Bahama"]
  },
  BH: {
    divisionName: "Governorates",
    regions: ["Manama", "Capital Governorate", "Muharraq Governorate", "Northern Governorate", "Southern Governorate"]
  },
  BD: {
    divisionName: "Divisions",
    regions: ["Dhaka", "Barisal", "Chittagong", "Khulna", "Mymensingh", "Rajshahi", "Rangpur", "Sylhet"]
  },
  BB: {
    divisionName: "Parishes",
    regions: ["Bridgetown", "Christ Church", "Saint Andrew", "Saint George", "Saint James", "Saint John", "Saint Joseph", "Saint Lucy", "Saint Michael", "Saint Peter", "Saint Philip", "Saint Thomas"]
  },
  BY: {
    divisionName: "Regions",
    regions: ["Minsk", "Brest Region", "Gomel Region", "Grodno Region", "Minsk Region", "Mogilev Region", "Vitebsk Region"]
  },
  BE: {
    divisionName: "Provinces",
    regions: ["Brussels", "Antwerp", "East Flanders", "Flemish Brabant", "Hainaut", "Liège", "Limburg", "Luxembourg", "Namur", "Walloon Brabant", "West Flanders"]
  },
  BZ: {
    divisionName: "Districts",
    regions: ["Belmopan", "Belize", "Cayo", "Corozal", "Orange Walk", "Stann Creek", "Toledo"]
  },
  BJ: {
    divisionName: "Departments",
    regions: ["Porto-Novo", "Alibori", "Atacora", "Atlantique", "Borgou", "Collines", "Couffo", "Donga", "Littoral", "Mono", "Ouémé", "Plateau", "Zou"]
  },
  BT: {
    divisionName: "Districts",
    regions: ["Thimphu", "Bumthang", "Chhukha", "Dagana", "Gasa", "Haa", "Lhuntse", "Mongar", "Paro", "Pemagatshel", "Punakha", "Samdrup Jongkhar", "Samtse", "Sarpang", "Trashigang", "Trashiyangtse", "Trongsa", "Tsirang", "Wangdue Phodrang", "Zhemgang"]
  },
  BO: {
    divisionName: "Departments",
    regions: ["Sucre", "La Paz", "Beni", "Chuquisaca", "Cochabamba", "Oruro", "Pando", "Potosí", "Santa Cruz", "Tarija"]
  },
  BA: {
    divisionName: "Entities/Cantons",
    regions: ["Sarajevo", "Federation of Bosnia and Herzegovina", "Republika Srpska", "Brčko District", "Una-Sana Canton", "Posavina Canton", "Tuzla Canton", "Zenica-Doboj Canton", "Bosnian-Podrinje Canton", "Central Bosnia Canton", "Herzegovina-Neretva Canton", "West Herzegovina Canton", "Canton 10"]
  },
  BW: {
    divisionName: "Districts",
    regions: ["Gaborone", "Central", "Chobe", "Ghanzi", "Kgalagadi", "Kgatleng", "Kweneng", "North-East", "North-West", "South-East", "Southern"]
  },
  BR: {
    divisionName: "States",
    regions: ["Brasília (DF)", "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia", "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"]
  },
  BN: {
    divisionName: "Districts",
    regions: ["Bandar Seri Begawan", "Belait", "Brunei-Muara", "Temburong", "Tutong"]
  },
  BG: {
    divisionName: "Provinces",
    regions: ["Sofia", "Blagoevgrad", "Burgas", "Dobrich", "Gabrovo", "Haskovo", "Kardzhali", "Kyustendil", "Lovech", "Montana", "Pazardzhik", "Pernik", "Pleven", "Plovdiv", "Razgrad", "Ruse", "Shumen", "Silistra", "Sliven", "Smolyan", "Sofia Province", "Stara Zagora", "Targovishte", "Varna", "Veliko Tarnovo", "Vidin", "Vratsa", "Yambol"]
  },
  BF: {
    divisionName: "Regions",
    regions: ["Ouagadougou", "Boucle du Mouhoun", "Cascades", "Centre", "Centre-Est", "Centre-Nord", "Centre-Ouest", "Centre-Sud", "Est", "Hauts-Bassins", "Nord", "Plateau-Central", "Sahel", "Sud-Ouest"]
  },
  BI: {
    divisionName: "Provinces",
    regions: ["Gitega", "Bubanza", "Bujumbura Mairie", "Bujumbura Rural", "Bururi", "Cankuzo", "Cibitoke", "Karuzi", "Kayanza", "Kirundo", "Makamba", "Muramvya", "Muyinga", "Mwaro", "Ngozi", "Rumonge", "Rutana", "Ruyigi"]
  },
  // C
  CV: {
    divisionName: "Municipalities",
    regions: ["Praia", "Boa Vista", "Brava", "Maio", "Mosteiros", "Paul", "Porto Novo", "Ribeira Brava", "Ribeira Grande", "Ribeira Grande de Santiago", "Sal", "Santa Catarina", "Santa Catarina do Fogo", "Santa Cruz", "São Domingos", "São Filipe", "São Lourenço dos Órgãos", "São Miguel", "São Salvador do Mundo", "São Vicente", "Tarrafal", "Tarrafal de São Nicolau"]
  },
  KH: {
    divisionName: "Provinces",
    regions: ["Phnom Penh", "Banteay Meanchey", "Battambang", "Kampong Cham", "Kampong Chhnang", "Kampong Speu", "Kampong Thom", "Kampot", "Kandal", "Kep", "Koh Kong", "Kratié", "Mondulkiri", "Oddar Meanchey", "Pailin", "Preah Sihanouk", "Preah Vihear", "Prey Veng", "Pursat", "Ratanakiri", "Siem Reap", "Stung Treng", "Svay Rieng", "Takéo", "Tboung Khmum"]
  },
  CM: {
    divisionName: "Regions",
    regions: ["Yaoundé", "Adamawa", "Centre", "East", "Far North", "Littoral", "North", "Northwest", "South", "Southwest", "West"]
  },
  CA: {
    divisionName: "Provinces/Territories",
    regions: ["Ottawa", "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"]
  },
  CF: {
    divisionName: "Prefectures",
    regions: ["Bangui", "Bamingui-Bangoran", "Basse-Kotto", "Haute-Kotto", "Haut-Mbomou", "Kémo", "Lobaye", "Mambéré-Kadéï", "Mbomou", "Nana-Grébizi", "Nana-Mambéré", "Ombella-M'Poko", "Ouaka", "Ouham", "Ouham-Pendé", "Sangha-Mbaéré", "Vakaga"]
  },
  TD: {
    divisionName: "Regions",
    regions: ["N'Djamena", "Bahr el Gazel", "Batha", "Borkou", "Chari-Baguirmi", "Ennedi-Est", "Ennedi-Ouest", "Guéra", "Hadjer-Lamis", "Kanem", "Lac", "Logone Occidental", "Logone Oriental", "Mandoul", "Mayo-Kebbi Est", "Mayo-Kebbi Ouest", "Moyen-Chari", "Ouaddaï", "Salamat", "Sila", "Tandjilé", "Tibesti", "Wadi Fira"]
  },
  CL: {
    divisionName: "Regions",
    regions: ["Santiago", "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso", "Metropolitana de Santiago", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"]
  },
  CN: {
    divisionName: "Provinces",
    regions: ["Beijing", "Anhui", "Chongqing", "Fujian", "Gansu", "Guangdong", "Guangxi", "Guizhou", "Hainan", "Hebei", "Heilongjiang", "Henan", "Hong Kong", "Hubei", "Hunan", "Inner Mongolia", "Jiangsu", "Jiangxi", "Jilin", "Liaoning", "Macau", "Ningxia", "Qinghai", "Shaanxi", "Shandong", "Shanghai", "Shanxi", "Sichuan", "Tianjin", "Tibet", "Xinjiang", "Yunnan", "Zhejiang"]
  },
  CO: {
    divisionName: "Departments",
    regions: ["Bogotá", "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada"]
  },
  KM: {
    divisionName: "Islands",
    regions: ["Moroni", "Grande Comore", "Anjouan", "Mohéli"]
  },
  CG: {
    divisionName: "Departments",
    regions: ["Brazzaville", "Bouenza", "Cuvette", "Cuvette-Ouest", "Kouilou", "Lékoumou", "Likouala", "Niari", "Plateaux", "Pointe-Noire", "Pool", "Sangha"]
  },
  CD: {
    divisionName: "Provinces",
    regions: ["Kinshasa", "Bas-Uele", "Équateur", "Haut-Katanga", "Haut-Lomami", "Haut-Uele", "Ituri", "Kasaï", "Kasaï-Central", "Kasaï-Oriental", "Kongo-Central", "Kwango", "Kwilu", "Lomami", "Lualaba", "Mai-Ndombe", "Maniema", "Mongala", "Nord-Kivu", "Nord-Ubangi", "Sankuru", "Sud-Kivu", "Sud-Ubangi", "Tanganyika", "Tshopo", "Tshuapa"]
  },
  CR: {
    divisionName: "Provinces",
    regions: ["San José", "Alajuela", "Cartago", "Guanacaste", "Heredia", "Limón", "Puntarenas"]
  },
  CI: {
    divisionName: "Districts",
    regions: ["Yamoussoukro", "Abidjan", "Bas-Sassandra", "Comoé", "Denguélé", "Gôh-Djiboua", "Lacs", "Lagunes", "Montagnes", "Sassandra-Marahoué", "Savanes", "Vallée du Bandama", "Woroba", "Zanzan"]
  },
  HR: {
    divisionName: "Counties",
    regions: ["Zagreb", "Bjelovar-Bilogora", "Brod-Posavina", "Dubrovnik-Neretva", "Istria", "Karlovac", "Koprivnica-Križevci", "Krapina-Zagorje", "Lika-Senj", "Međimurje", "Osijek-Baranja", "Požega-Slavonia", "Primorje-Gorski Kotar", "Šibenik-Knin", "Sisak-Moslavina", "Split-Dalmatia", "Varaždin", "Virovitica-Podravina", "Vukovar-Srijem", "Zadar", "Zagreb County"]
  },
  CU: {
    divisionName: "Provinces",
    regions: ["Havana", "Artemisa", "Camagüey", "Ciego de Ávila", "Cienfuegos", "Granma", "Guantánamo", "Holguín", "Isla de la Juventud", "Las Tunas", "Matanzas", "Mayabeque", "Pinar del Río", "Sancti Spíritus", "Santiago de Cuba", "Villa Clara"]
  },
  CY: {
    divisionName: "Districts",
    regions: ["Nicosia", "Famagusta", "Kyrenia", "Larnaca", "Limassol", "Paphos"]
  },
  CZ: {
    divisionName: "Regions",
    regions: ["Prague", "Central Bohemian", "Hradec Králové", "Karlovy Vary", "Liberec", "Moravian-Silesian", "Olomouc", "Pardubice", "Plzeň", "South Bohemian", "South Moravian", "Ústí nad Labem", "Vysočina", "Zlín"]
  },
  // D
  DK: {
    divisionName: "Regions",
    regions: ["Copenhagen", "Capital Region", "Central Denmark", "North Denmark", "Zealand", "Southern Denmark"]
  },
  DJ: {
    divisionName: "Regions",
    regions: ["Djibouti City", "Ali Sabieh", "Arta", "Dikhil", "Obock", "Tadjourah"]
  },
  DM: {
    divisionName: "Parishes",
    regions: ["Roseau", "Saint Andrew", "Saint David", "Saint George", "Saint John", "Saint Joseph", "Saint Luke", "Saint Mark", "Saint Patrick", "Saint Paul", "Saint Peter"]
  },
  DO: {
    divisionName: "Provinces",
    regions: ["Santo Domingo", "Azua", "Baoruco", "Barahona", "Dajabón", "Distrito Nacional", "Duarte", "El Seibo", "Elías Piña", "Espaillat", "Hato Mayor", "Hermanas Mirabal", "Independencia", "La Altagracia", "La Romana", "La Vega", "María Trinidad Sánchez", "Monseñor Nouel", "Monte Cristi", "Monte Plata", "Pedernales", "Peravia", "Puerto Plata", "Samaná", "San Cristóbal", "San José de Ocoa", "San Juan", "San Pedro de Macorís", "Sánchez Ramírez", "Santiago", "Santiago Rodríguez", "Santo Domingo Province", "Valverde"]
  },
  // E
  EC: {
    divisionName: "Provinces",
    regions: ["Quito", "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi", "El Oro", "Esmeraldas", "Galápagos", "Guayas", "Imbabura", "Loja", "Los Ríos", "Manabí", "Morona-Santiago", "Napo", "Orellana", "Pastaza", "Pichincha", "Santa Elena", "Santo Domingo de los Tsáchilas", "Sucumbíos", "Tungurahua", "Zamora-Chinchipe"]
  },
  EG: {
    divisionName: "Governorates",
    regions: ["Cairo", "Alexandria", "Aswan", "Asyut", "Beheira", "Beni Suef", "Dakahlia", "Damietta", "Faiyum", "Gharbia", "Giza", "Ismailia", "Kafr el-Sheikh", "Luxor", "Matruh", "Minya", "Monufia", "New Valley", "North Sinai", "Port Said", "Qalyubia", "Qena", "Red Sea", "Sharqia", "Sohag", "South Sinai", "Suez"]
  },
  SV: {
    divisionName: "Departments",
    regions: ["San Salvador", "Ahuachapán", "Cabañas", "Chalatenango", "Cuscatlán", "La Libertad", "La Paz", "La Unión", "Morazán", "San Miguel", "San Vicente", "Santa Ana", "Sonsonate", "Usulután"]
  },
  GQ: {
    divisionName: "Provinces",
    regions: ["Malabo", "Annobón", "Bioko Norte", "Bioko Sur", "Centro Sur", "Djibloho", "Kié-Ntem", "Litoral", "Wele-Nzas"]
  },
  ER: {
    divisionName: "Regions",
    regions: ["Asmara", "Anseba", "Debub", "Gash-Barka", "Maekel", "Northern Red Sea", "Southern Red Sea"]
  },
  EE: {
    divisionName: "Counties",
    regions: ["Tallinn", "Harju", "Hiiu", "Ida-Viru", "Järva", "Jõgeva", "Lääne", "Lääne-Viru", "Pärnu", "Põlva", "Rapla", "Saare", "Tartu", "Valga", "Viljandi", "Võru"]
  },
  SZ: {
    divisionName: "Regions",
    regions: ["Mbabane", "Hhohho", "Lubombo", "Manzini", "Shiselweni"]
  },
  ET: {
    divisionName: "Regions",
    regions: ["Addis Ababa", "Afar", "Amhara", "Benishangul-Gumuz", "Dire Dawa", "Gambela", "Harari", "Oromia", "Sidama", "Somali", "South Ethiopia", "Southern Nations", "Southwest Ethiopia", "Tigray"]
  },
  // F
  FJ: {
    divisionName: "Divisions",
    regions: ["Suva", "Central", "Eastern", "Northern", "Western"]
  },
  FI: {
    divisionName: "Regions",
    regions: ["Helsinki", "Åland", "Central Finland", "Central Ostrobothnia", "Kainuu", "Kanta-Häme", "Kymenlaakso", "Lapland", "North Karelia", "North Ostrobothnia", "North Savo", "Ostrobothnia", "Päijät-Häme", "Pirkanmaa", "Satakunta", "South Karelia", "South Ostrobothnia", "South Savo", "Southwest Finland", "Uusimaa"]
  },
  FR: {
    divisionName: "Regions",
    regions: ["Paris", "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Brittany", "Centre-Val de Loire", "Corsica", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandy", "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur"]
  },
  // G
  GA: {
    divisionName: "Provinces",
    regions: ["Libreville", "Estuaire", "Haut-Ogooué", "Moyen-Ogooué", "Ngounié", "Nyanga", "Ogooué-Ivindo", "Ogooué-Lolo", "Ogooué-Maritime", "Woleu-Ntem"]
  },
  GM: {
    divisionName: "Divisions",
    regions: ["Banjul", "Central River", "Lower River", "North Bank", "Upper River", "West Coast"]
  },
  GE: {
    divisionName: "Regions",
    regions: ["Tbilisi", "Abkhazia", "Adjara", "Guria", "Imereti", "Kakheti", "Kvemo Kartli", "Mtskheta-Mtianeti", "Racha-Lechkhumi and Kvemo Svaneti", "Samegrelo-Zemo Svaneti", "Samtskhe-Javakheti", "Shida Kartli"]
  },
  DE: {
    divisionName: "States",
    regions: ["Berlin", "Baden-Württemberg", "Bavaria", "Brandenburg", "Bremen", "Hamburg", "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"]
  },
  GH: {
    divisionName: "Regions",
    regions: ["Accra", "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "North East", "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North"]
  },
  GR: {
    divisionName: "Regions",
    regions: ["Athens", "Attica", "Central Greece", "Central Macedonia", "Crete", "Eastern Macedonia and Thrace", "Epirus", "Ionian Islands", "North Aegean", "Peloponnese", "South Aegean", "Thessaly", "Western Greece", "Western Macedonia"]
  },
  GD: {
    divisionName: "Parishes",
    regions: ["St. George's", "Carriacou and Petite Martinique", "Saint Andrew", "Saint David", "Saint George", "Saint John", "Saint Mark", "Saint Patrick"]
  },
  GT: {
    divisionName: "Departments",
    regions: ["Guatemala City", "Alta Verapaz", "Baja Verapaz", "Chimaltenango", "Chiquimula", "El Progreso", "Escuintla", "Guatemala", "Huehuetenango", "Izabal", "Jalapa", "Jutiapa", "Petén", "Quetzaltenango", "Quiché", "Retalhuleu", "Sacatepéquez", "San Marcos", "Santa Rosa", "Sololá", "Suchitepéquez", "Totonicapán", "Zacapa"]
  },
  GN: {
    divisionName: "Regions",
    regions: ["Conakry", "Boké", "Faranah", "Kankan", "Kindia", "Labé", "Mamou", "N'Zérékoré"]
  },
  GW: {
    divisionName: "Regions",
    regions: ["Bissau", "Bafatá", "Biombo", "Bolama", "Cacheu", "Gabú", "Oio", "Quinara", "Tombali"]
  },
  GY: {
    divisionName: "Regions",
    regions: ["Georgetown", "Barima-Waini", "Cuyuni-Mazaruni", "Demerara-Mahaica", "East Berbice-Corentyne", "Essequibo Islands-West Demerara", "Mahaica-Berbice", "Pomeroon-Supenaam", "Potaro-Siparuni", "Upper Demerara-Berbice", "Upper Takutu-Upper Essequibo"]
  },
  // H
  HT: {
    divisionName: "Departments",
    regions: ["Port-au-Prince", "Artibonite", "Centre", "Grand'Anse", "Nippes", "Nord", "Nord-Est", "Nord-Ouest", "Ouest", "Sud", "Sud-Est"]
  },
  HN: {
    divisionName: "Departments",
    regions: ["Tegucigalpa", "Atlántida", "Choluteca", "Colón", "Comayagua", "Copán", "Cortés", "El Paraíso", "Francisco Morazán", "Gracias a Dios", "Intibucá", "Islas de la Bahía", "La Paz", "Lempira", "Ocotepeque", "Olancho", "Santa Bárbara", "Valle", "Yoro"]
  },
  HK: {
    divisionName: "Districts",
    regions: ["Central and Western", "Eastern", "Islands", "Kowloon City", "Kwai Tsing", "Kwun Tong", "North", "Sai Kung", "Sha Tin", "Sham Shui Po", "Southern", "Tai Po", "Tsuen Wan", "Tuen Mun", "Wan Chai", "Wong Tai Sin", "Yau Tsim Mong", "Yuen Long"]
  },
  HU: {
    divisionName: "Counties",
    regions: ["Budapest", "Bács-Kiskun", "Baranya", "Békés", "Borsod-Abaúj-Zemplén", "Csongrád-Csanád", "Fejér", "Győr-Moson-Sopron", "Hajdú-Bihar", "Heves", "Jász-Nagykun-Szolnok", "Komárom-Esztergom", "Nógrád", "Pest", "Somogy", "Szabolcs-Szatmár-Bereg", "Tolna", "Vas", "Veszprém", "Zala"]
  },
  // I
  IS: {
    divisionName: "Regions",
    regions: ["Reykjavik", "Capital Region", "Southern Peninsula", "Western Region", "Westfjords", "Northwestern Region", "Northeastern Region", "Eastern Region", "Southern Region"]
  },
  IN: {
    divisionName: "States/Territories",
    regions: ["New Delhi", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"]
  },
  ID: {
    divisionName: "Provinces",
    regions: ["Jakarta", "Aceh", "Bali", "Bangka Belitung", "Banten", "Bengkulu", "Central Java", "Central Kalimantan", "Central Sulawesi", "East Java", "East Kalimantan", "East Nusa Tenggara", "Gorontalo", "Jambi", "Lampung", "Maluku", "North Kalimantan", "North Maluku", "North Sulawesi", "North Sumatra", "Papua", "Riau", "Riau Islands", "South Kalimantan", "South Sulawesi", "South Sumatra", "Southeast Sulawesi", "West Java", "West Kalimantan", "West Nusa Tenggara", "West Papua", "West Sulawesi", "West Sumatra", "Yogyakarta"]
  },
  IR: {
    divisionName: "Provinces",
    regions: ["Tehran", "Alborz", "Ardabil", "Bushehr", "Chaharmahal and Bakhtiari", "East Azerbaijan", "Fars", "Gilan", "Golestan", "Hamadan", "Hormozgan", "Ilam", "Isfahan", "Kerman", "Kermanshah", "Khuzestan", "Kohgiluyeh and Boyer-Ahmad", "Kurdistan", "Lorestan", "Markazi", "Mazandaran", "North Khorasan", "Qazvin", "Qom", "Razavi Khorasan", "Semnan", "Sistan and Baluchestan", "South Khorasan", "West Azerbaijan", "Yazd", "Zanjan"]
  },
  IQ: {
    divisionName: "Governorates",
    regions: ["Baghdad", "Al Anbar", "Basra", "Dhi Qar", "Diyala", "Dohuk", "Erbil", "Halabja", "Karbala", "Kirkuk", "Maysan", "Muthanna", "Najaf", "Nineveh", "Qadisiyyah", "Saladin", "Sulaymaniyah", "Wasit"]
  },
  IE: {
    divisionName: "Counties",
    regions: ["Dublin", "Carlow", "Cavan", "Clare", "Cork", "Donegal", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary", "Waterford", "Westmeath", "Wexford", "Wicklow"]
  },
  IL: {
    divisionName: "Districts",
    regions: ["Jerusalem", "Central", "Haifa", "Northern", "Southern", "Tel Aviv"]
  },
  IT: {
    divisionName: "Regions",
    regions: ["Rome", "Abruzzo", "Aosta Valley", "Apulia", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli Venezia Giulia", "Lazio", "Liguria", "Lombardy", "Marche", "Molise", "Piedmont", "Sardinia", "Sicily", "Trentino-Alto Adige", "Tuscany", "Umbria", "Veneto"]
  },
  // J
  JM: {
    divisionName: "Parishes",
    regions: ["Kingston", "Clarendon", "Hanover", "Manchester", "Portland", "Saint Andrew", "Saint Ann", "Saint Catherine", "Saint Elizabeth", "Saint James", "Saint Mary", "Saint Thomas", "Trelawny", "Westmoreland"]
  },
  JP: {
    divisionName: "Prefectures",
    regions: ["Tokyo", "Aichi", "Akita", "Aomori", "Chiba", "Ehime", "Fukui", "Fukuoka", "Fukushima", "Gifu", "Gunma", "Hiroshima", "Hokkaido", "Hyogo", "Ibaraki", "Ishikawa", "Iwate", "Kagawa", "Kagoshima", "Kanagawa", "Kochi", "Kumamoto", "Kyoto", "Mie", "Miyagi", "Miyazaki", "Nagano", "Nagasaki", "Nara", "Niigata", "Oita", "Okayama", "Okinawa", "Osaka", "Saga", "Saitama", "Shiga", "Shimane", "Shizuoka", "Tochigi", "Tokushima", "Tottori", "Toyama", "Wakayama", "Yamagata", "Yamaguchi", "Yamanashi"]
  },
  JO: {
    divisionName: "Governorates",
    regions: ["Amman", "Ajloun", "Aqaba", "Balqa", "Irbid", "Jerash", "Karak", "Ma'an", "Madaba", "Mafraq", "Tafilah", "Zarqa"]
  },
  // K
  KZ: {
    divisionName: "Regions",
    regions: ["Astana", "Almaty", "Akmola", "Aktobe", "Atyrau", "East Kazakhstan", "Jambyl", "Karaganda", "Kostanay", "Kyzylorda", "Mangystau", "North Kazakhstan", "Pavlodar", "Shymkent", "Turkistan", "West Kazakhstan"]
  },
  KE: {
    divisionName: "Counties",
    regions: ["Nairobi", "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans-Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"]
  },
  KI: {
    divisionName: "Islands",
    regions: ["South Tarawa", "Gilbert Islands", "Line Islands", "Phoenix Islands"]
  },
  KP: {
    divisionName: "Provinces",
    regions: ["Pyongyang", "Chagang", "North Hamgyong", "South Hamgyong", "North Hwanghae", "South Hwanghae", "Kangwon", "North Pyongan", "South Pyongan", "Rason", "Ryanggang"]
  },
  KR: {
    divisionName: "Provinces",
    regions: ["Seoul", "Busan", "Daegu", "Daejeon", "Gangwon", "Gwangju", "Gyeonggi", "Incheon", "Jeju", "North Chungcheong", "North Gyeongsang", "North Jeolla", "Sejong", "South Chungcheong", "South Gyeongsang", "South Jeolla", "Ulsan"]
  },
  XK: {
    divisionName: "Districts",
    regions: ["Pristina", "Ferizaj", "Gjakova", "Gjilan", "Mitrovica", "Peja", "Prizren"]
  },
  KW: {
    divisionName: "Governorates",
    regions: ["Kuwait City", "Ahmadi", "Farwaniya", "Hawalli", "Jahra", "Mubarak Al-Kabeer"]
  },
  KG: {
    divisionName: "Regions",
    regions: ["Bishkek", "Batken", "Chuy", "Issyk-Kul", "Jalal-Abad", "Naryn", "Osh", "Talas"]
  },
  // L
  LA: {
    divisionName: "Provinces",
    regions: ["Vientiane", "Attapeu", "Bokeo", "Bolikhamxai", "Champasak", "Houaphanh", "Khammouane", "Luang Namtha", "Luang Prabang", "Oudomxay", "Phongsaly", "Salavan", "Savannakhet", "Sekong", "Vientiane Province", "Xaisomboun", "Xayabury", "Xiangkhouang"]
  },
  LV: {
    divisionName: "Regions",
    regions: ["Riga", "Kurzeme", "Latgale", "Pieriga", "Vidzeme", "Zemgale"]
  },
  LB: {
    divisionName: "Governorates",
    regions: ["Beirut", "Akkar", "Baalbek-Hermel", "Beqaa", "Keserwan-Jbeil", "Mount Lebanon", "Nabatieh", "North", "South"]
  },
  LS: {
    divisionName: "Districts",
    regions: ["Maseru", "Berea", "Butha-Buthe", "Leribe", "Mafeteng", "Mohale's Hoek", "Mokhotlong", "Qacha's Nek", "Quthing", "Thaba-Tseka"]
  },
  LR: {
    divisionName: "Counties",
    regions: ["Monrovia", "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount", "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland", "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"]
  },
  LY: {
    divisionName: "Districts",
    regions: ["Tripoli", "Al Wahat", "Benghazi", "Butnan", "Derna", "Fezzan", "Ghat", "Jabal al Akhdar", "Jabal al Gharbi", "Jafara", "Jufra", "Kufra", "Marj", "Misrata", "Murqub", "Murzuq", "Nalut", "Nuqat al Khams", "Sabha", "Sirte", "Wadi al Hayaa", "Wadi al Shatii", "Zawiya"]
  },
  LI: {
    divisionName: "Municipalities",
    regions: ["Vaduz", "Balzers", "Eschen", "Gamprin", "Mauren", "Planken", "Ruggell", "Schaan", "Schellenberg", "Triesen", "Triesenberg"]
  },
  LT: {
    divisionName: "Counties",
    regions: ["Vilnius", "Alytus", "Kaunas", "Klaipėda", "Marijampolė", "Panevėžys", "Šiauliai", "Tauragė", "Telšiai", "Utena"]
  },
  LU: {
    divisionName: "Cantons",
    regions: ["Luxembourg City", "Capellen", "Clervaux", "Diekirch", "Echternach", "Esch-sur-Alzette", "Grevenmacher", "Mersch", "Redange", "Remich", "Vianden", "Wiltz"]
  },
  // M
  MG: {
    divisionName: "Regions",
    regions: ["Antananarivo", "Alaotra-Mangoro", "Amoron'i Mania", "Analamanga", "Analanjirofo", "Androy", "Anosy", "Atsimo-Andrefana", "Atsimo-Atsinanana", "Atsinanana", "Betsiboka", "Boeny", "Bongolava", "Diana", "Haute Matsiatra", "Ihorombe", "Itasy", "Melaky", "Menabe", "Sava", "Sofia", "Vakinankaratra", "Vatovavy-Fitovinany"]
  },
  MW: {
    divisionName: "Regions",
    regions: ["Lilongwe", "Central Region", "Northern Region", "Southern Region"]
  },
  MY: {
    divisionName: "States",
    regions: ["Kuala Lumpur", "Johor", "Kedah", "Kelantan", "Labuan", "Melaka", "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Putrajaya", "Sabah", "Sarawak", "Selangor", "Terengganu"]
  },
  MV: {
    divisionName: "Atolls",
    regions: ["Malé", "Addu", "Alif Alif", "Alif Dhaal", "Baa", "Dhaalu", "Faafu", "Gaafu Alif", "Gaafu Dhaalu", "Gnaviyani", "Haa Alif", "Haa Dhaalu", "Kaafu", "Laamu", "Lhaviyani", "Meemu", "Noonu", "Raa", "Shaviyani", "Thaa", "Vaavu"]
  },
  ML: {
    divisionName: "Regions",
    regions: ["Bamako", "Gao", "Kayes", "Kidal", "Koulikoro", "Mopti", "Ségou", "Sikasso", "Taoudénit", "Tombouctou"]
  },
  MT: {
    divisionName: "Regions",
    regions: ["Valletta", "Gozo and Comino", "Northern", "Northern Harbour", "South Eastern", "Southern Harbour", "Western"]
  },
  MH: {
    divisionName: "Municipalities",
    regions: ["Majuro", "Ailinglaplap", "Ailuk", "Arno", "Aur", "Ebon", "Enewetak", "Jabat", "Jaluit", "Kili", "Kwajalein", "Lae", "Lib", "Likiep", "Maloelap", "Mejit", "Mili", "Namorik", "Namu", "Rongelap", "Ujae", "Ujelang", "Utirik", "Wotho", "Wotje"]
  },
  MR: {
    divisionName: "Regions",
    regions: ["Nouakchott", "Adrar", "Assaba", "Brakna", "Dakhlet Nouadhibou", "Gorgol", "Guidimaka", "Hodh Ech Chargui", "Hodh El Gharbi", "Inchiri", "Nouakchott Nord", "Nouakchott Ouest", "Nouakchott Sud", "Tagant", "Tiris Zemmour", "Trarza"]
  },
  MU: {
    divisionName: "Districts",
    regions: ["Port Louis", "Agaléga", "Black River", "Cargados Carajos", "Flacq", "Grand Port", "Moka", "Pamplemousses", "Plaines Wilhems", "Rivière du Rempart", "Rodrigues", "Savanne"]
  },
  MX: {
    divisionName: "States",
    regions: ["Mexico City", "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "México", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"]
  },
  FM: {
    divisionName: "States",
    regions: ["Palikir", "Chuuk", "Kosrae", "Pohnpei", "Yap"]
  },
  MD: {
    divisionName: "Districts",
    regions: ["Chișinău", "Anenii Noi", "Bălți", "Basarabeasca", "Bender", "Briceni", "Cahul", "Călărași", "Cantemir", "Căușeni", "Cimișlia", "Criuleni", "Dondușeni", "Drochia", "Dubăsari", "Edineț", "Fălești", "Florești", "Gagauzia", "Glodeni", "Hîncești", "Ialoveni", "Leova", "Nisporeni", "Ocnița", "Orhei", "Rezina", "Rîșcani", "Sîngerei", "Șoldănești", "Soroca", "Ștefan Vodă", "Strășeni", "Taraclia", "Telenești", "Transnistria", "Ungheni"]
  },
  MC: {
    divisionName: "Quarters",
    regions: ["Monaco-Ville", "Fontvieille", "La Condamine", "Larvotto", "Moneghetti", "Monte Carlo", "Saint Michel", "Saint Roman"]
  },
  MN: {
    divisionName: "Provinces",
    regions: ["Ulaanbaatar", "Arkhangai", "Bayan-Ölgii", "Bayankhongor", "Bulgan", "Darkhan-Uul", "Dornod", "Dornogovi", "Dundgovi", "Govi-Altai", "Govisümber", "Khentii", "Khovd", "Khövsgöl", "Ömnögovi", "Orkhon", "Övörkhangai", "Selenge", "Sükhbaatar", "Töv", "Uvs", "Zavkhan"]
  },
  ME: {
    divisionName: "Municipalities",
    regions: ["Podgorica", "Andrijevica", "Bar", "Berane", "Bijelo Polje", "Budva", "Cetinje", "Danilovgrad", "Gusinje", "Herceg Novi", "Kolašin", "Kotor", "Mojkovac", "Nikšić", "Petnjica", "Plav", "Pljevlja", "Plužine", "Rožaje", "Šavnik", "Tivat", "Tuzi", "Ulcinj", "Žabljak"]
  },
  MA: {
    divisionName: "Regions",
    regions: ["Rabat", "Béni Mellal-Khénifra", "Casablanca-Settat", "Dakhla-Oued Ed-Dahab", "Drâa-Tafilalet", "Fès-Meknès", "Guelmim-Oued Noun", "Laâyoune-Sakia El Hamra", "Marrakech-Safi", "Oriental", "Rabat-Salé-Kénitra", "Souss-Massa", "Tanger-Tétouan-Al Hoceïma"]
  },
  MZ: {
    divisionName: "Provinces",
    regions: ["Maputo", "Cabo Delgado", "Gaza", "Inhambane", "Manica", "Maputo Province", "Nampula", "Niassa", "Sofala", "Tete", "Zambezia"]
  },
  MM: {
    divisionName: "States/Regions",
    regions: ["Naypyidaw", "Ayeyarwady", "Bago", "Chin", "Kachin", "Kayah", "Kayin", "Magway", "Mandalay", "Mon", "Rakhine", "Sagaing", "Shan", "Tanintharyi", "Yangon"]
  },
  // N
  NA: {
    divisionName: "Regions",
    regions: ["Windhoek", "Erongo", "Hardap", "Karas", "Kavango East", "Kavango West", "Khomas", "Kunene", "Ohangwena", "Omaheke", "Omusati", "Oshana", "Oshikoto", "Otjozondjupa", "Zambezi"]
  },
  NR: {
    divisionName: "Districts",
    regions: ["Yaren", "Aiwo", "Anabar", "Anetan", "Anibare", "Baiti", "Boe", "Buada", "Denigomodu", "Ewa", "Ijuw", "Meneng", "Nibok", "Uaboe"]
  },
  NP: {
    divisionName: "Provinces",
    regions: ["Kathmandu", "Bagmati", "Gandaki", "Karnali", "Koshi", "Lumbini", "Madhesh", "Sudurpashchim"]
  },
  NL: {
    divisionName: "Provinces",
    regions: ["Amsterdam", "Drenthe", "Flevoland", "Friesland", "Gelderland", "Groningen", "Limburg", "North Brabant", "North Holland", "Overijssel", "South Holland", "Utrecht", "Zeeland"]
  },
  NZ: {
    divisionName: "Regions",
    regions: ["Wellington", "Auckland", "Bay of Plenty", "Canterbury", "Gisborne", "Hawke's Bay", "Manawatū-Whanganui", "Marlborough", "Nelson", "Northland", "Otago", "Southland", "Taranaki", "Tasman", "Waikato", "West Coast"]
  },
  NI: {
    divisionName: "Departments",
    regions: ["Managua", "Boaco", "Carazo", "Chinandega", "Chontales", "Estelí", "Granada", "Jinotega", "León", "Madriz", "Matagalpa", "North Caribbean Coast", "Nueva Segovia", "Río San Juan", "Rivas", "South Caribbean Coast"]
  },
  NE: {
    divisionName: "Regions",
    regions: ["Niamey", "Agadez", "Diffa", "Dosso", "Maradi", "Tahoua", "Tillabéri", "Zinder"]
  },
  NG: {
    divisionName: "States",
    regions: ["Abuja", "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"]
  },
  MK: {
    divisionName: "Regions",
    regions: ["Skopje", "Eastern", "Northeastern", "Pelagonia", "Polog", "Southeastern", "Southwestern", "Vardar"]
  },
  NO: {
    divisionName: "Counties",
    regions: ["Oslo", "Agder", "Innlandet", "Møre og Romsdal", "Nordland", "Rogaland", "Troms og Finnmark", "Trøndelag", "Vestfold og Telemark", "Vestland", "Viken"]
  },
  // O
  OM: {
    divisionName: "Governorates",
    regions: ["Muscat", "Ad Dakhiliyah", "Ad Dhahirah", "Al Batinah North", "Al Batinah South", "Al Buraimi", "Al Sharqiyah North", "Al Sharqiyah South", "Al Wusta", "Dhofar", "Musandam"]
  },
  // P
  PK: {
    divisionName: "Provinces/Territories",
    regions: ["Islamabad", "Azad Kashmir", "Balochistan", "Gilgit-Baltistan", "Khyber Pakhtunkhwa", "Punjab", "Sindh"]
  },
  PW: {
    divisionName: "States",
    regions: ["Ngerulmud", "Aimeliik", "Airai", "Angaur", "Hatohobei", "Kayangel", "Koror", "Melekeok", "Ngaraard", "Ngarchelong", "Ngardmau", "Ngatpang", "Ngchesar", "Ngeremlengui", "Ngiwal", "Peleliu", "Sonsorol"]
  },
  PS: {
    divisionName: "Governorates",
    regions: ["Ramallah", "Bethlehem", "Deir al-Balah", "Gaza", "Hebron", "Jenin", "Jericho", "Jerusalem", "Khan Yunis", "Nablus", "North Gaza", "Qalqilya", "Rafah", "Salfit", "Tubas", "Tulkarm"]
  },
  PA: {
    divisionName: "Provinces",
    regions: ["Panama City", "Bocas del Toro", "Chiriquí", "Coclé", "Colón", "Darién", "Emberá-Wounaan", "Guna Yala", "Herrera", "Los Santos", "Ngäbe-Buglé", "Panamá", "Panamá Oeste", "Veraguas"]
  },
  PG: {
    divisionName: "Provinces",
    regions: ["Port Moresby", "Bougainville", "Central", "Chimbu", "East New Britain", "East Sepik", "Eastern Highlands", "Enga", "Gulf", "Hela", "Jiwaka", "Madang", "Manus", "Milne Bay", "Morobe", "New Ireland", "Northern", "Southern Highlands", "West New Britain", "West Sepik", "Western", "Western Highlands"]
  },
  PY: {
    divisionName: "Departments",
    regions: ["Asunción", "Alto Paraguay", "Alto Paraná", "Amambay", "Boquerón", "Caaguazú", "Caazapá", "Canindeyú", "Central", "Concepción", "Cordillera", "Guairá", "Itapúa", "Misiones", "Ñeembucú", "Paraguarí", "Presidente Hayes", "San Pedro"]
  },
  PE: {
    divisionName: "Regions",
    regions: ["Lima", "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"]
  },
  PH: {
    divisionName: "Regions",
    regions: ["Manila", "Bangsamoro", "Bicol", "Cagayan Valley", "Calabarzon", "Caraga", "Central Luzon", "Central Visayas", "Cordillera", "Davao", "Eastern Visayas", "Ilocos", "Mimaropa", "NCR", "Northern Mindanao", "Soccsksargen", "Western Visayas", "Zamboanga Peninsula"]
  },
  PL: {
    divisionName: "Voivodeships",
    regions: ["Warsaw", "Greater Poland", "Kuyavian-Pomeranian", "Lesser Poland", "Łódź", "Lower Silesian", "Lublin", "Lubusz", "Masovian", "Opole", "Podkarpackie", "Podlaskie", "Pomeranian", "Silesian", "Świętokrzyskie", "Warmian-Masurian", "West Pomeranian"]
  },
  PT: {
    divisionName: "Districts",
    regions: ["Lisbon", "Aveiro", "Azores", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Madeira", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"]
  },
  // Q
  QA: {
    divisionName: "Municipalities",
    regions: ["Doha", "Al Daayen", "Al Khawr", "Al Rayyan", "Al Shahaniya", "Al Shamal", "Al Wakrah", "Madinat ash Shamal", "Umm Salal"]
  },
  // R
  RO: {
    divisionName: "Counties",
    regions: ["București", "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", "Brăila", "Brașov", "Buzău", "Călărași", "Caraș-Severin", "Cluj", "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu", "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș", "Mehedinți", "Mureș", "Neamț", "Olt", "Prahova", "Sălaj", "Satu Mare", "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea", "Vâlcea", "Vaslui", "Vrancea"]
  },
  RU: {
    divisionName: "Federal Subjects",
    regions: ["Moscow", "Adygea", "Altai Krai", "Altai Republic", "Amur Oblast", "Arkhangelsk Oblast", "Astrakhan Oblast", "Bashkortostan", "Belgorod Oblast", "Bryansk Oblast", "Buryatia", "Chechnya", "Chelyabinsk Oblast", "Chukotka", "Chuvashia", "Dagestan", "Ingushetia", "Irkutsk Oblast", "Ivanovo Oblast", "Jewish Autonomous Oblast", "Kabardino-Balkaria", "Kaliningrad Oblast", "Kalmykia", "Kaluga Oblast", "Kamchatka Krai", "Karachay-Cherkessia", "Karelia", "Kemerovo Oblast", "Khabarovsk Krai", "Khakassia", "Khanty-Mansi", "Kirov Oblast", "Komi", "Kostroma Oblast", "Krasnodar Krai", "Krasnoyarsk Krai", "Kurgan Oblast", "Kursk Oblast", "Leningrad Oblast", "Lipetsk Oblast", "Magadan Oblast", "Mari El", "Mordovia", "Moscow Oblast", "Murmansk Oblast", "Nenets", "Nizhny Novgorod Oblast", "North Ossetia", "Novgorod Oblast", "Novosibirsk Oblast", "Omsk Oblast", "Orenburg Oblast", "Oryol Oblast", "Penza Oblast", "Perm Krai", "Primorsky Krai", "Pskov Oblast", "Rostov Oblast", "Ryazan Oblast", "Saint Petersburg", "Sakha", "Sakhalin Oblast", "Samara Oblast", "Saratov Oblast", "Smolensk Oblast", "Stavropol Krai", "Sverdlovsk Oblast", "Tambov Oblast", "Tatarstan", "Tomsk Oblast", "Tula Oblast", "Tuva", "Tver Oblast", "Tyumen Oblast", "Udmurtia", "Ulyanovsk Oblast", "Vladimir Oblast", "Volgograd Oblast", "Vologda Oblast", "Voronezh Oblast", "Yamalo-Nenets", "Yaroslavl Oblast", "Zabaykalsky Krai"]
  },
  RW: {
    divisionName: "Provinces",
    regions: ["Kigali", "Eastern", "Northern", "Southern", "Western"]
  },
  // S
  KN: {
    divisionName: "Parishes",
    regions: ["Basseterre", "Christ Church Nichola Town", "Saint Anne Sandy Point", "Saint George Basseterre", "Saint George Gingerland", "Saint James Windward", "Saint John Capisterre", "Saint John Figtree", "Saint Mary Cayon", "Saint Paul Capisterre", "Saint Paul Charlestown", "Saint Peter Basseterre", "Saint Thomas Lowland", "Saint Thomas Middle Island", "Trinity Palmetto Point"]
  },
  LC: {
    divisionName: "Districts",
    regions: ["Castries", "Anse la Raye", "Canaries", "Choiseul", "Dennery", "Gros Islet", "Laborie", "Micoud", "Soufrière", "Vieux Fort"]
  },
  VC: {
    divisionName: "Parishes",
    regions: ["Kingstown", "Charlotte", "Grenadines", "Saint Andrew", "Saint David", "Saint George", "Saint Patrick"]
  },
  WS: {
    divisionName: "Districts",
    regions: ["Apia", "A'ana", "Aiga-i-le-Tai", "Atua", "Fa'asaleleaga", "Gaga'emauga", "Gagaifomauga", "Palauli", "Satupa'itea", "Tuamasaga", "Va'a-o-Fonoti", "Vaisigano"]
  },
  SM: {
    divisionName: "Municipalities",
    regions: ["San Marino City", "Acquaviva", "Borgo Maggiore", "Chiesanuova", "Domagnano", "Faetano", "Fiorentino", "Montegiardino", "Serravalle"]
  },
  ST: {
    divisionName: "Districts",
    regions: ["São Tomé", "Água Grande", "Cantagalo", "Caué", "Lembá", "Lobata", "Mé-Zóchi", "Príncipe"]
  },
  SA: {
    divisionName: "Regions",
    regions: ["Riyadh", "Al Bahah", "Al Jawf", "Al Madinah", "Al Qassim", "Asir", "Eastern Province", "Ha'il", "Jazan", "Makkah", "Najran", "Northern Borders", "Tabuk"]
  },
  SN: {
    divisionName: "Regions",
    regions: ["Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor"]
  },
  RS: {
    divisionName: "Districts",
    regions: ["Belgrade", "Bor", "Braničevo", "Central Banat", "Jablanica", "Kolubara", "Kosovo", "Mačva", "Moravica", "Nišava", "North Bačka", "North Banat", "Pčinja", "Pirot", "Podunavlje", "Pomoravlje", "Rasina", "Raška", "South Bačka", "South Banat", "Srem", "Šumadija", "Toplica", "West Bačka", "Zaječar", "Zlatibor"]
  },
  SC: {
    divisionName: "Districts",
    regions: ["Victoria", "Anse aux Pins", "Anse Boileau", "Anse Etoile", "Anse Royale", "Au Cap", "Baie Lazare", "Baie Sainte Anne", "Beau Vallon", "Bel Air", "Bel Ombre", "Cascade", "Glacis", "Grand Anse Mahe", "Grand Anse Praslin", "Ile Perseverance I", "Ile Perseverance II", "La Digue", "La Riviere Anglaise", "Les Mamelles", "Mont Buxton", "Mont Fleuri", "Plaisance", "Pointe Larue", "Port Glaud", "Roche Caiman", "Saint Louis", "Takamaka"]
  },
  SL: {
    divisionName: "Provinces",
    regions: ["Freetown", "Eastern", "Northern", "North West", "Southern", "Western Area"]
  },
  SG: {
    divisionName: "Regions",
    regions: ["Singapore", "Central", "East", "North", "North-East", "West"]
  },
  SK: {
    divisionName: "Regions",
    regions: ["Bratislava", "Banská Bystrica", "Košice", "Nitra", "Prešov", "Trenčín", "Trnava", "Žilina"]
  },
  SI: {
    divisionName: "Regions",
    regions: ["Ljubljana", "Carinthia", "Carniola", "Central Sava", "Central Slovenia", "Coastal-Karst", "Drava", "Gorizia", "Inner Carniola-Karst", "Lower Sava", "Mura", "Savinja", "Southeast Slovenia", "Upper Carniola"]
  },
  SB: {
    divisionName: "Provinces",
    regions: ["Honiara", "Central", "Choiseul", "Guadalcanal", "Isabel", "Makira-Ulawa", "Malaita", "Rennell and Bellona", "Temotu", "Western"]
  },
  SO: {
    divisionName: "States",
    regions: ["Mogadishu", "Awdal", "Bakool", "Banadir", "Bari", "Bay", "Galguduud", "Gedo", "Hiiraan", "Lower Juba", "Lower Shabelle", "Middle Juba", "Middle Shabelle", "Mudug", "Nugaal", "Sanaag", "Sool", "Togdheer", "Woqooyi Galbeed"]
  },
  ZA: {
    divisionName: "Provinces",
    regions: ["Pretoria", "Cape Town", "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"]
  },
  SS: {
    divisionName: "States",
    regions: ["Juba", "Central Equatoria", "Eastern Equatoria", "Jonglei", "Lakes", "Northern Bahr el Ghazal", "Unity", "Upper Nile", "Warrap", "Western Bahr el Ghazal", "Western Equatoria"]
  },
  ES: {
    divisionName: "Autonomous Communities",
    regions: ["Madrid", "Andalusia", "Aragon", "Asturias", "Balearic Islands", "Basque Country", "Canary Islands", "Cantabria", "Castile and León", "Castile-La Mancha", "Catalonia", "Ceuta", "Extremadura", "Galicia", "La Rioja", "Melilla", "Murcia", "Navarre", "Valencia"]
  },
  LK: {
    divisionName: "Provinces",
    regions: ["Sri Jayawardenepura Kotte", "Central", "Eastern", "North Central", "North Western", "Northern", "Sabaragamuwa", "Southern", "Uva", "Western"]
  },
  SD: {
    divisionName: "States",
    regions: ["Khartoum", "Al Jazirah", "Blue Nile", "Central Darfur", "East Darfur", "Kassala", "North Darfur", "North Kordofan", "Northern", "Red Sea", "River Nile", "Sennar", "South Darfur", "South Kordofan", "West Darfur", "West Kordofan", "White Nile"]
  },
  SR: {
    divisionName: "Districts",
    regions: ["Paramaribo", "Brokopondo", "Commewijne", "Coronie", "Marowijne", "Nickerie", "Para", "Saramacca", "Sipaliwini", "Wanica"]
  },
  SE: {
    divisionName: "Counties",
    regions: ["Stockholm", "Blekinge", "Dalarna", "Gävleborg", "Gotland", "Halland", "Jämtland", "Jönköping", "Kalmar", "Kronoberg", "Norrbotten", "Örebro", "Östergötland", "Skåne", "Södermanland", "Uppsala", "Värmland", "Västerbotten", "Västernorrland", "Västmanland", "Västra Götaland"]
  },
  CH: {
    divisionName: "Cantons",
    regions: ["Bern", "Aargau", "Appenzell Ausserrhoden", "Appenzell Innerrhoden", "Basel-Landschaft", "Basel-Stadt", "Fribourg", "Geneva", "Glarus", "Graubünden", "Jura", "Lucerne", "Neuchâtel", "Nidwalden", "Obwalden", "Schaffhausen", "Schwyz", "Solothurn", "St. Gallen", "Thurgau", "Ticino", "Uri", "Valais", "Vaud", "Zug", "Zürich"]
  },
  SY: {
    divisionName: "Governorates",
    regions: ["Damascus", "Aleppo", "Al-Hasakah", "Daraa", "Deir ez-Zor", "Hama", "Homs", "Idlib", "Latakia", "Quneitra", "Raqqa", "Rif Dimashq", "Suwayda", "Tartus"]
  },
  // T
  TW: {
    divisionName: "Counties/Cities",
    regions: ["Taipei", "Changhua", "Chiayi", "Chiayi City", "Hsinchu", "Hsinchu City", "Hualien", "Kaohsiung", "Keelung", "Kinmen", "Lienchiang", "Miaoli", "Nantou", "New Taipei", "Penghu", "Pingtung", "Taichung", "Tainan", "Taitung", "Taoyuan", "Yilan", "Yunlin"]
  },
  TJ: {
    divisionName: "Regions",
    regions: ["Dushanbe", "Districts of Republican Subordination", "Gorno-Badakhshan", "Khatlon", "Sughd"]
  },
  TZ: {
    divisionName: "Regions",
    regions: ["Dodoma", "Arusha", "Dar es Salaam", "Geita", "Iringa", "Kagera", "Katavi", "Kigoma", "Kilimanjaro", "Lindi", "Manyara", "Mara", "Mbeya", "Morogoro", "Mtwara", "Mwanza", "Njombe", "Pemba North", "Pemba South", "Pwani", "Rukwa", "Ruvuma", "Shinyanga", "Simiyu", "Singida", "Songwe", "Tabora", "Tanga", "Unguja North", "Unguja South", "Unguja West"]
  },
  TH: {
    divisionName: "Provinces",
    regions: ["Bangkok", "Amnat Charoen", "Ang Thong", "Bueng Kan", "Buri Ram", "Chachoengsao", "Chai Nat", "Chaiyaphum", "Chanthaburi", "Chiang Mai", "Chiang Rai", "Chon Buri", "Chumphon", "Kalasin", "Kamphaeng Phet", "Kanchanaburi", "Khon Kaen", "Krabi", "Lampang", "Lamphun", "Loei", "Lop Buri", "Mae Hong Son", "Maha Sarakham", "Mukdahan", "Nakhon Nayok", "Nakhon Pathom", "Nakhon Phanom", "Nakhon Ratchasima", "Nakhon Sawan", "Nakhon Si Thammarat", "Nan", "Narathiwat", "Nong Bua Lam Phu", "Nong Khai", "Nonthaburi", "Pathum Thani", "Pattani", "Phang Nga", "Phatthalung", "Phayao", "Phetchabun", "Phetchaburi", "Phichit", "Phitsanulok", "Phra Nakhon Si Ayutthaya", "Phrae", "Phuket", "Prachin Buri", "Prachuap Khiri Khan", "Ranong", "Ratchaburi", "Rayong", "Roi Et", "Sa Kaeo", "Sakon Nakhon", "Samut Prakan", "Samut Sakhon", "Samut Songkhram", "Saraburi", "Satun", "Si Sa Ket", "Sing Buri", "Songkhla", "Sukhothai", "Suphan Buri", "Surat Thani", "Surin", "Tak", "Trang", "Trat", "Ubon Ratchathani", "Udon Thani", "Uthai Thani", "Uttaradit", "Yala", "Yasothon"]
  },
  TL: {
    divisionName: "Municipalities",
    regions: ["Dili", "Aileu", "Ainaro", "Baucau", "Bobonaro", "Cova Lima", "Ermera", "Lautém", "Liquiçá", "Manatuto", "Manufahi", "Oecusse", "Viqueque"]
  },
  TG: {
    divisionName: "Regions",
    regions: ["Lomé", "Centrale", "Kara", "Maritime", "Plateaux", "Savanes"]
  },
  TO: {
    divisionName: "Divisions",
    regions: ["Nuku'alofa", "Eua", "Ha'apai", "Niuas", "Tongatapu", "Vava'u"]
  },
  TT: {
    divisionName: "Regions/Boroughs",
    regions: ["Port of Spain", "Arima", "Chaguanas", "Couva-Tabaquite-Talparo", "Diego Martin", "Mayaro-Rio Claro", "Penal-Debe", "Point Fortin", "Princes Town", "San Fernando", "San Juan-Laventille", "Sangre Grande", "Siparia", "Tobago", "Tunapuna-Piarco"]
  },
  TN: {
    divisionName: "Governorates",
    regions: ["Tunis", "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", "Kairouan", "Kasserine", "Kébili", "Kef", "Mahdia", "Manouba", "Médenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine", "Tozeur", "Zaghouan"]
  },
  TR: {
    divisionName: "Provinces",
    regions: ["Ankara", "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Iğdır", "Isparta", "Istanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Şırnak", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"]
  },
  TM: {
    divisionName: "Regions",
    regions: ["Ashgabat", "Ahal", "Balkan", "Daşoguz", "Lebap", "Mary"]
  },
  TV: {
    divisionName: "Islands",
    regions: ["Funafuti", "Nanumanga", "Nanumea", "Niutao", "Nui", "Nukufetau", "Nukulaelae", "Vaitupu"]
  },
  // U
  UG: {
    divisionName: "Regions",
    regions: ["Kampala", "Central", "Eastern", "Northern", "Western"]
  },
  UA: {
    divisionName: "Oblasts",
    regions: ["Kyiv", "Cherkasy", "Chernihiv", "Chernivtsi", "Crimea", "Dnipropetrovsk", "Donetsk", "Ivano-Frankivsk", "Kharkiv", "Kherson", "Khmelnytskyi", "Kirovohrad", "Kyiv Oblast", "Luhansk", "Lviv", "Mykolaiv", "Odesa", "Poltava", "Rivne", "Sevastopol", "Sumy", "Ternopil", "Vinnytsia", "Volyn", "Zakarpattia", "Zaporizhzhia", "Zhytomyr"]
  },
  AE: {
    divisionName: "Emirates",
    regions: ["Abu Dhabi", "Ajman", "Dubai", "Fujairah", "Ras Al Khaimah", "Sharjah", "Umm Al Quwain"]
  },
  GB: {
    divisionName: "Countries/Regions",
    regions: ["London", "England", "Northern Ireland", "Scotland", "Wales", "East Midlands", "East of England", "Greater London", "North East", "North West", "South East", "South West", "West Midlands", "Yorkshire and the Humber"]
  },
  US: {
    divisionName: "States",
    regions: ["Washington D.C.", "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"]
  },
  UY: {
    divisionName: "Departments",
    regions: ["Montevideo", "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", "Flores", "Florida", "Lavalleja", "Maldonado", "Paysandú", "Río Negro", "Rivera", "Rocha", "Salto", "San José", "Soriano", "Tacuarembó", "Treinta y Tres"]
  },
  UZ: {
    divisionName: "Regions",
    regions: ["Tashkent", "Andijan", "Bukhara", "Fergana", "Jizzakh", "Karakalpakstan", "Kashkadarya", "Khorezm", "Namangan", "Navoiy", "Samarkand", "Sirdaryo", "Surkhandarya", "Tashkent Region"]
  },
  // V
  VU: {
    divisionName: "Provinces",
    regions: ["Port Vila", "Malampa", "Penama", "Sanma", "Shefa", "Tafea", "Torba"]
  },
  VA: {
    divisionName: "City-State",
    regions: ["Vatican City"]
  },
  VE: {
    divisionName: "States",
    regions: ["Caracas", "Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar", "Carabobo", "Cojedes", "Delta Amacuro", "Falcón", "Guárico", "La Guaira", "Lara", "Mérida", "Miranda", "Monagas", "Nueva Esparta", "Portuguesa", "Sucre", "Táchira", "Trujillo", "Yaracuy", "Zulia"]
  },
  VN: {
    divisionName: "Provinces",
    regions: ["Hanoi", "An Giang", "Bà Rịa–Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Ho Chi Minh City", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên–Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"]
  },
  // Y
  YE: {
    divisionName: "Governorates",
    regions: ["Sana'a", "Aden", "Al Bayda", "Al Dhale'e", "Al Hudaydah", "Al Jawf", "Al Mahrah", "Al Mahwit", "Amanat Al Asimah", "Amran", "Dhamar", "Hadhramaut", "Hajjah", "Ibb", "Lahij", "Ma'rib", "Raymah", "Sa'dah", "Shabwah", "Socotra", "Ta'izz"]
  },
  // Z
  ZM: {
    divisionName: "Provinces",
    regions: ["Lusaka", "Central", "Copperbelt", "Eastern", "Luapula", "Muchinga", "North-Western", "Northern", "Southern", "Western"]
  },
  ZW: {
    divisionName: "Provinces",
    regions: ["Harare", "Bulawayo", "Manicaland", "Mashonaland Central", "Mashonaland East", "Mashonaland West", "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands"]
  }
};

/**
 * Get the administrative division data for a country
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns CountryAdminData or undefined if not found
 */
export const getCountryAdminData = (countryCode: string): CountryAdminData | undefined => {
  return countryAdminDivisions[countryCode];
};

/**
 * Get the division name for a country (e.g., "Counties", "States", "Provinces")
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Division name or "Region" as default
 */
export const getDivisionName = (countryCode: string): string => {
  return countryAdminDivisions[countryCode]?.divisionName || "Region";
};

/**
 * Get the regions/divisions for a country
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Array of region names or empty array if not found
 */
export const getCountryRegions = (countryCode: string): string[] => {
  return countryAdminDivisions[countryCode]?.regions || [];
};
