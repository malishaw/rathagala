// Shared brand lists used by both the sell form, admin carousel, and brand filter pages

export const vehicleMakes = [
  // Popular brands first
  "Toyota", "Suzuki", "Honda", "Nissan", "Mitsubishi", "BMW", "Audi", "BYD",
  // Rest alphabetically
  "Acura", "Alfa-Romeo", "Aprilia", "Ashok-Leyland", "Aston", "Atco", "ATHER",
  "Austin", "Baic", "Bajaj", "Bentley", "Borgward",
  "Cadillac", "Cal", "CAT", "Ceygra", "Changan", "Chery", "Chevrolet",
  "Chrysler", "Citroen", "Corvette", "Daewoo", "Daido", "Daihatsu", "Datsun",
  "Demak", "Dfac", "DFSK", "Ducati", "Dyno", "Eicher", "FAW", "Ferrari", "Fiat",
  "Force", "Ford", "Foton", "Hero", "Hero-Honda", "Higer", "Hillman", "HINO",
  "Hitachi", "Holden", "Hummer", "Hyundai", "IHI", "Isuzu", "Iveco",
  "JAC", "Jaguar", "JCB", "Jeep", "JiaLing", "JMC", "John-Deere", "Jonway",
  "KAPLA", "Kawasaki", "Kia", "Kinetic", "KMC", "Kobelco", "Komatsu", "KTM",
  "Kubota", "Lamborghini", "Land-Rover", "Lexus", "Loncin", "Longjia", "Lotus",
  "Lti", "Mahindra", "Maserati", "Massey-Ferguson", "Mazda", "Mercedes-Benz",
  "Metrocab", "MG", "Mg-Rover", "Micro", "Mini", "Minnelli",
  "Morgan", "Morris", "New-Holland", "NWOW", "Opel", "Other",
  "Perodua", "Peugeot", "Piaggio", "Porsche", "Powertrac", "Proton",
  "Range-Rover", "Ranomoto", "Renault", "Reva", "REVOLT", "Rolls-Royce", "Saab",
  "Sakai", "Seat", "Senaro", "Singer", "Skoda", "Smart", "Sonalika", "Subaru",
  "Swaraj", "Syuk", "TAFE", "TAILG", "Tata", "Tesla",
  "Triumph", "TVS", "Vauxhall", "Vespa", "Volkswagen", "Volvo", "Wave", "Willys",
  "Yadea", "Yamaha", "Yanmar", "Yuejin", "Zongshen", "Zotye"
];

export const motorbikeBrands = [
  "Honda", "Yamaha", "Suzuki", "Kawasaki", "BMW Motorrad", "Ducati", "KTM", "Husqvarna",
  "GasGas", "Aprilia", "Moto Guzzi", "MV Agusta", "Benelli", "CFMoto", "Royal Enfield",
  "Triumph", "Harley-Davidson", "Indian", "Victory", "Zero Motorcycles", "Energica",
  "LiveWire", "Bajaj", "TVS", "Hero", "Hero Honda", "Mahindra", "Jawa", "Yezdi",
  "Lifan", "Loncin", "Zongshen", "QJMotor", "Keeway", "Kymco", "SYM", "PGO",
  "Aeon", "Daelim", "Hyosung", "Sanyang", "AJP", "Beta", "Sherco", "Fantic",
  "Rieju", "Derbi", "Montesa", "Bultaco", "Ossa", "MZ", "Ural", "Izh",
  "Jawa Moto", "CZ", "Zundapp", "NSU", "Horex", "Brough Superior", "Norton", "Vincent",
  "Matchless", "AJS", "Royal Enfield (UK)", "Lambretta", "Vespa", "Piaggio", "Gilera",
  "Italjet", "Malaguti", "Cagiva", "SWM", "Mondial", "Kreidler", "Sachs", "Peugeot Motocycles",
  "MBK", "Romet", "Junak", "Bajaj Auto", "TVS Motor", "Hero MotoCorp", "Kymstone", "Zontes",
  "Voge", "Haojue", "Dayang", "Husaberg", "Alta Motors", "Buccaneer", "Mash", "Arch Motorcycle"
];

// Combined unique brand list
export const allBrands = [...new Set([...vehicleMakes, ...motorbikeBrands])].sort();
