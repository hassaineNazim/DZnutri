"""Référentiel des additifs alimentaires DZnutri (aliments généraux, codes E / SIN / INS).

Chaque additif dispose de toutes les colonnes nécessaires :
- e_number : code européen (E100, E330, etc.)
- sin_number : Système International de Numérotation algérien/international (SIN 100, SIN100...)
- ins_number : International Numbering System Codex Alimentarius (INS 100, INS100...)
- name : nom officiel français
- danger_level : 1 (limité), 2 (modéré), 3 (élevé)
- description : explication scientifique concise
- source : origine (Naturel, Synthétique, Minéral, etc.)
- category : famille fonctionnelle (Colorant, Conservateur, etc.)
"""

FOOD_ADDITIVES = [
    {
        "e_number": "E100",
        "sin_number": "SIN100",
        "ins_number": "INS100",
        "name": "Curcumine",
        "danger_level": 1,
        "description": "Colorant jaune naturel extrait du curcuma",
        "source": "Naturel",
        "category": "Colorant"
    },
    {
        "e_number": "E101",
        "sin_number": "SIN101",
        "ins_number": "INS101",
        "name": "Riboflavine (Vitamine B2)",
        "danger_level": 1,
        "description": "Colorant naturel jaune",
        "source": "Naturel",
        "category": "Colorant"
    },
    {
        "e_number": "E102",
        "sin_number": "SIN102",
        "ins_number": "INS102",
        "name": "Tartrazine",
        "danger_level": 3,
        "description": "Colorant jaune synthétique, possible allergène",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E103",
        "sin_number": "SIN103",
        "ins_number": "INS103",
        "name": "Alkanna",
        "danger_level": 2,
        "description": "Colorant synthétique/ naturel utilisé localement",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E104",
        "sin_number": "SIN104",
        "ins_number": "INS104",
        "name": "Quinoline Yellow",
        "danger_level": 3,
        "description": "Colorant jaune synthétique",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E105",
        "sin_number": "SIN105",
        "ins_number": "INS105",
        "name": "Fast Yellow AB",
        "danger_level": 2,
        "description": "Colorant jaune",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E107",
        "sin_number": "SIN107",
        "ins_number": "INS107",
        "name": "Yellow 2G",
        "danger_level": 2,
        "description": "Colorant alimentaire synthétique",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E110",
        "sin_number": "SIN110",
        "ins_number": "INS110",
        "name": "Jaune orangé S",
        "danger_level": 3,
        "description": "Colorant azoïque lié à des allergies",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E110A",
        "sin_number": "SIN110a",
        "ins_number": "INS110a",
        "name": "Sunset Yellow FCF (variante)",
        "danger_level": 3,
        "description": "Colorant azoïque",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E112",
        "sin_number": "SIN112",
        "ins_number": "INS112",
        "name": "Ponceau SX",
        "danger_level": 3,
        "description": "Colorant rouge",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E113",
        "sin_number": "SIN113",
        "ins_number": "INS113",
        "name": "Alizarine",
        "danger_level": 3,
        "description": "Colorant synthétique",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E120",
        "sin_number": "SIN120",
        "ins_number": "INS120",
        "name": "Cochénille",
        "danger_level": 2,
        "description": "Colorant rouge issu d’insectes",
        "source": "Naturel (insectes)",
        "category": "Colorant"
    },
    {
        "e_number": "E120A",
        "sin_number": "SIN120a",
        "ins_number": "INS120a",
        "name": "Cochénille (variante)",
        "danger_level": 2,
        "description": "Colorant naturel issu d’insectes",
        "source": "Naturel",
        "category": "Colorant"
    },
    {
        "e_number": "E122",
        "sin_number": "SIN122",
        "ins_number": "INS122",
        "name": "Carmoisine",
        "danger_level": 3,
        "description": "Colorant rouge azoïque, lié à l’hyperactivité",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E123",
        "sin_number": "SIN123",
        "ins_number": "INS123",
        "name": "Amarante / Ponceau 6R",
        "danger_level": 3,
        "description": "Colorant rouge synthétique",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E124",
        "sin_number": "SIN124",
        "ins_number": "INS124",
        "name": "Rouge cochenille A",
        "danger_level": 3,
        "description": "Colorant rouge synthétique",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E127",
        "sin_number": "SIN127",
        "ins_number": "INS127",
        "name": "Erythrosine",
        "danger_level": 2,
        "description": "Colorant rouge synthétique",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E128",
        "sin_number": "SIN128",
        "ins_number": "INS128",
        "name": "Red 2G",
        "danger_level": 3,
        "description": "Colorant rouge azoïque",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E129",
        "sin_number": "SIN129",
        "ins_number": "INS129",
        "name": "Rouge Allura AC",
        "danger_level": 3,
        "description": "Colorant rouge synthétique",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E131",
        "sin_number": "SIN131",
        "ins_number": "INS131",
        "name": "Blue PN",
        "danger_level": 2,
        "description": "Colorant bleu synthétique",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E132",
        "sin_number": "SIN132",
        "ins_number": "INS132",
        "name": "Indigo carmine",
        "danger_level": 2,
        "description": "Colorant bleu",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E133",
        "sin_number": "SIN133",
        "ins_number": "INS133",
        "name": "Bleu brillant FCF",
        "danger_level": 2,
        "description": "Colorant bleu synthétique",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E140",
        "sin_number": "SIN140",
        "ins_number": "INS140",
        "name": "Chlorophylle",
        "danger_level": 1,
        "description": "Colorant vert naturel",
        "source": "Naturel",
        "category": "Colorant"
    },
    {
        "e_number": "E141",
        "sin_number": "SIN141",
        "ins_number": "INS141",
        "name": "Chlorophylline",
        "danger_level": 1,
        "description": "Dérivé de chlorophylle",
        "source": "Naturel",
        "category": "Colorant"
    },
    {
        "e_number": "E142",
        "sin_number": "SIN142",
        "ins_number": "INS142",
        "name": "Vert S",
        "danger_level": 2,
        "description": "Colorant vert synthétique",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E150A",
        "sin_number": "SIN150a",
        "ins_number": "INS150a",
        "name": "Caramel simple",
        "danger_level": 1,
        "description": "Colorant brun obtenu par chauffage de sucres",
        "source": "Naturel",
        "category": "Colorant"
    },
    {
        "e_number": "E150B",
        "sin_number": "SIN150b",
        "ins_number": "INS150b",
        "name": "Caramel au sulfite de sodium",
        "danger_level": 2,
        "description": "Colorant caramel",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E150D",
        "sin_number": "SIN150d",
        "ins_number": "INS150d",
        "name": "Caramel au sulfite d’ammonium",
        "danger_level": 2,
        "description": "Colorant brun, suspicion d’effets sur la santé",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E151",
        "sin_number": "SIN151",
        "ins_number": "INS151",
        "name": "Brilliant Black PN",
        "danger_level": 2,
        "description": "Colorant noir",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E153",
        "sin_number": "SIN153",
        "ins_number": "INS153",
        "name": "Carbonne végétale",
        "danger_level": 1,
        "description": "Colorant noir naturel (carbone)",
        "source": "Naturel",
        "category": "Colorant"
    },
    {
        "e_number": "E154",
        "sin_number": "SIN154",
        "ins_number": "INS154",
        "name": "Brun FK",
        "danger_level": 2,
        "description": "Colorant brun",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E155",
        "sin_number": "SIN155",
        "ins_number": "INS155",
        "name": "Brun HT",
        "danger_level": 2,
        "description": "Colorant brun",
        "source": "Synthétique",
        "category": "Colorant"
    },
    {
        "e_number": "E160A",
        "sin_number": "SIN160a",
        "ins_number": "INS160a",
        "name": "Bêta-carotène",
        "danger_level": 1,
        "description": "Pigment naturel orange, précurseur de la Vitamine A",
        "source": "Naturel",
        "category": "Colorant"
    },
    {
        "e_number": "E160B",
        "sin_number": "SIN160b",
        "ins_number": "INS160b",
        "name": "Annatto",
        "danger_level": 2,
        "description": "Colorant naturel orange-rouge, parfois allergène",
        "source": "Naturel",
        "category": "Colorant"
    },
    {
        "e_number": "E160C",
        "sin_number": "SIN160c",
        "ins_number": "INS160c",
        "name": "Capsanthine / paprika",
        "danger_level": 1,
        "description": "Extrait de paprika",
        "source": "Naturel",
        "category": "Colorant"
    },
    {
        "e_number": "E161B",
        "sin_number": "SIN161b",
        "ins_number": "INS161b",
        "name": "Lutéine",
        "danger_level": 1,
        "description": "Pigment naturel",
        "source": "Naturel",
        "category": "Colorant"
    },
    {
        "e_number": "E162",
        "sin_number": "SIN162",
        "ins_number": "INS162",
        "name": "Rouge de betterave (betanine)",
        "danger_level": 1,
        "description": "Colorant naturel",
        "source": "Naturel",
        "category": "Colorant"
    },
    {
        "e_number": "E163",
        "sin_number": "SIN163",
        "ins_number": "INS163",
        "name": "Anthocyanes",
        "danger_level": 1,
        "description": "Pigments naturels (fruits rouges)",
        "source": "Naturel",
        "category": "Colorant"
    },
    {
        "e_number": "E171",
        "sin_number": "SIN171",
        "ins_number": "INS171",
        "name": "Dioxyde de titane",
        "danger_level": 3,
        "description": "Colorant blanc minéral interdit dans l'UE dans l'alimentation depuis 2022 (suspicion de génotoxicité sous forme nanoparticulaire).",
        "source": "Minéral",
        "category": "Colorant"
    },
    {
        "e_number": "E172",
        "sin_number": "SIN172",
        "ins_number": "INS172",
        "name": "Oxydes de fer",
        "danger_level": 1,
        "description": "Colorants minéraux (jaune, rouge, noir) dérivés du fer, sans risque majeur identifié aux doses d'usage.",
        "source": "Minéral",
        "category": "Colorant"
    },
    {
        "e_number": "E200",
        "sin_number": "SIN200",
        "ins_number": "INS200",
        "name": "Acide sorbique",
        "danger_level": 1,
        "description": "Conservateur antifongique",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E200A",
        "sin_number": "SIN200a",
        "ins_number": "INS200a",
        "name": "Sorbique (variante)",
        "danger_level": 1,
        "description": "Conservateur antifongique",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E202",
        "sin_number": "SIN202",
        "ins_number": "INS202",
        "name": "Sorbate de potassium",
        "danger_level": 1,
        "description": "Conservateur antifongique courant",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E203",
        "sin_number": "SIN203",
        "ins_number": "INS203",
        "name": "Propionate de calcium",
        "danger_level": 1,
        "description": "Conservateur antifongique",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E204",
        "sin_number": "SIN204",
        "ins_number": "INS204",
        "name": "Sulfite de potassium",
        "danger_level": 2,
        "description": "Conservateur (sulfites)",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E205",
        "sin_number": "SIN205",
        "ins_number": "INS205",
        "name": "Sulfite de sodium",
        "danger_level": 2,
        "description": "Conservateur (sulfites)",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E206",
        "sin_number": "SIN206",
        "ins_number": "INS206",
        "name": "Formiate de calcium",
        "danger_level": 2,
        "description": "Conservateur",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E209",
        "sin_number": "SIN209",
        "ins_number": "INS209",
        "name": "Formiate de potassium",
        "danger_level": 2,
        "description": "Conservateur",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E210",
        "sin_number": "SIN210",
        "ins_number": "INS210",
        "name": "Acide benzoïque",
        "danger_level": 2,
        "description": "Conservateur antimicrobien",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E211",
        "sin_number": "SIN211",
        "ins_number": "INS211",
        "name": "Benzoate de sodium",
        "danger_level": 2,
        "description": "Conservateur courant dans les sodas",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E212",
        "sin_number": "SIN212",
        "ins_number": "INS212",
        "name": "Benzoate de potassium",
        "danger_level": 2,
        "description": "Conservateur antimicrobien utilisé dans les boissons acides. Risque allergique et formation de benzène en présence de vitamine C.",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E213",
        "sin_number": "SIN213",
        "ins_number": "INS213",
        "name": "p-Hydroxybenzoate d’isopropyle",
        "danger_level": 2,
        "description": "Paraben (conservateur)",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E214",
        "sin_number": "SIN214",
        "ins_number": "INS214",
        "name": "Ethylparaben",
        "danger_level": 2,
        "description": "Paraben, conservateur",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E215",
        "sin_number": "SIN215",
        "ins_number": "INS215",
        "name": "Benzoate d’éthyle (sel)",
        "danger_level": 2,
        "description": "Sel de paraben",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E216",
        "sin_number": "SIN216",
        "ins_number": "INS216",
        "name": "p-Hydroxybenzoate d’éthyle",
        "danger_level": 2,
        "description": "Paraben",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E217",
        "sin_number": "SIN217",
        "ins_number": "INS217",
        "name": "p-Hydroxybenzoate de propyle (sel)",
        "danger_level": 2,
        "description": "Paraben",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E218",
        "sin_number": "SIN218",
        "ins_number": "INS218",
        "name": "p-Hydroxybenzoate de méthyle",
        "danger_level": 2,
        "description": "Paraben",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E219",
        "sin_number": "SIN219",
        "ins_number": "INS219",
        "name": "p-Hydroxybenzoate de baryum",
        "danger_level": 2,
        "description": "Paraben",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E220",
        "sin_number": "SIN220",
        "ins_number": "INS220",
        "name": "Anhydride sulfureux",
        "danger_level": 3,
        "description": "Conservateur, peut provoquer des allergies",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E223",
        "sin_number": "SIN223",
        "ins_number": "INS223",
        "name": "Métabisulfite de sodium",
        "danger_level": 3,
        "description": "Conservateur sulfité",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E224",
        "sin_number": "SIN224",
        "ins_number": "INS224",
        "name": "Sulfite de potassium, variante",
        "danger_level": 2,
        "description": "Sulfite conservateur",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E226",
        "sin_number": "SIN226",
        "ins_number": "INS226",
        "name": "Sulfite de calcium",
        "danger_level": 2,
        "description": "Conservateur sulfité",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E227",
        "sin_number": "SIN227",
        "ins_number": "INS227",
        "name": "Sulfite de sodium, variante",
        "danger_level": 2,
        "description": "Conservateur sulfité",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E230",
        "sin_number": "SIN230",
        "ins_number": "INS230",
        "name": "Biphényles",
        "danger_level": 3,
        "description": "Conservateur antifongique (usage limité)",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E231",
        "sin_number": "SIN231",
        "ins_number": "INS231",
        "name": "Orthophénylphénol",
        "danger_level": 3,
        "description": "Conservateur, usage contrôlé",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E232",
        "sin_number": "SIN232",
        "ins_number": "INS232",
        "name": "Sodium orthophénylphénolate",
        "danger_level": 3,
        "description": "Conservateur",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E234",
        "sin_number": "SIN234",
        "ins_number": "INS234",
        "name": "Nisin (variante)",
        "danger_level": 1,
        "description": "Conservateur bactericide (peptides)",
        "source": "Naturel",
        "category": "Conservateur"
    },
    {
        "e_number": "E235",
        "sin_number": "SIN235",
        "ins_number": "INS235",
        "name": "Natamycine",
        "danger_level": 1,
        "description": "Antifongique naturel",
        "source": "Naturel",
        "category": "Conservateur"
    },
    {
        "e_number": "E239",
        "sin_number": "SIN239",
        "ins_number": "INS239",
        "name": "Hexaméthylène tetramine",
        "danger_level": 3,
        "description": "Agent conservateur (usage limité)",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E249",
        "sin_number": "SIN249",
        "ins_number": "INS249",
        "name": "Nitrite de potassium",
        "danger_level": 3,
        "description": "Conservateur utilisé dans les charcuteries",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E250",
        "sin_number": "SIN250",
        "ins_number": "INS250",
        "name": "Nitrite de sodium",
        "danger_level": 3,
        "description": "Conservateur très controversé, cancérogène potentiel",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E250A",
        "sin_number": "SIN250a",
        "ins_number": "INS250a",
        "name": "Nitrite variante",
        "danger_level": 3,
        "description": "Conservateur nitrité",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E251",
        "sin_number": "SIN251",
        "ins_number": "INS251",
        "name": "Nitrate de sodium",
        "danger_level": 3,
        "description": "Conservateur, risque de formation de nitrosamines",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E252",
        "sin_number": "SIN252",
        "ins_number": "INS252",
        "name": "Nitrate de potassium",
        "danger_level": 3,
        "description": "Conservateur, risque similaire aux nitrites",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E260",
        "sin_number": "SIN260",
        "ins_number": "INS260",
        "name": "Acide acétique",
        "danger_level": 1,
        "description": "Régulateur d’acidité (vinaigre)",
        "source": "Naturel",
        "category": "Régulateur d’acidité"
    },
    {
        "e_number": "E260A",
        "sin_number": "SIN260a",
        "ins_number": "INS260a",
        "name": "Acide acétique (variante)",
        "danger_level": 1,
        "description": "Régulateur d’acidité",
        "source": "Naturel",
        "category": "Acidifiant"
    },
    {
        "e_number": "E270",
        "sin_number": "SIN270",
        "ins_number": "INS270",
        "name": "Acide lactique",
        "danger_level": 1,
        "description": "Acidifiant naturel",
        "source": "Naturel",
        "category": "Régulateur d’acidité"
    },
    {
        "e_number": "E281",
        "sin_number": "SIN281",
        "ins_number": "INS281",
        "name": "Propionate de sodium",
        "danger_level": 1,
        "description": "Conservateur",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E282",
        "sin_number": "SIN282",
        "ins_number": "INS282",
        "name": "Propionate de calcium",
        "danger_level": 1,
        "description": "Conservateur",
        "source": "Synthhétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E283",
        "sin_number": "SIN283",
        "ins_number": "INS283",
        "name": "Propionate de potassium",
        "danger_level": 1,
        "description": "Conservateur",
        "source": "Synthétique",
        "category": "Conservateur"
    },
    {
        "e_number": "E290",
        "sin_number": "SIN290",
        "ins_number": "INS290",
        "name": "Dioxyde de carbone",
        "danger_level": 1,
        "description": "Gaz réfrigérant / conservateur",
        "source": "Naturel",
        "category": "Gaz alimentaire"
    },
    {
        "e_number": "E300",
        "sin_number": "SIN300",
        "ins_number": "INS300",
        "name": "Acide ascorbique (Vitamine C)",
        "danger_level": 1,
        "description": "Antioxydant naturel",
        "source": "Naturel",
        "category": "Antioxydant"
    },
    {
        "e_number": "E300A",
        "sin_number": "SIN300a",
        "ins_number": "INS300a",
        "name": "Ascorbate de sodium",
        "danger_level": 1,
        "description": "Antioxydant (dérivé de vitamine C)",
        "source": "Synthétique",
        "category": "Antioxydant"
    },
    {
        "e_number": "E301",
        "sin_number": "SIN301",
        "ins_number": "INS301",
        "name": "Ascorbate de sodium",
        "danger_level": 1,
        "description": "Antioxydant, sel de vitamine C",
        "source": "Synthétique",
        "category": "Antioxydant"
    },
    {
        "e_number": "E302",
        "sin_number": "SIN302",
        "ins_number": "INS302",
        "name": "Ascorbate de calcium",
        "danger_level": 1,
        "description": "Antioxydant",
        "source": "Synthétique",
        "category": "Antioxydant"
    },
    {
        "e_number": "E304",
        "sin_number": "SIN304",
        "ins_number": "INS304",
        "name": "Palmitate d’ascorbyle",
        "danger_level": 1,
        "description": "Antioxydant liposoluble",
        "source": "Synthétique",
        "category": "Antioxydant"
    },
    {
        "e_number": "E306",
        "sin_number": "SIN306",
        "ins_number": "INS306",
        "name": "Extraits de tocophérols (Vitamine E)",
        "danger_level": 1,
        "description": "Antioxydant naturel",
        "source": "Naturel",
        "category": "Antioxydant"
    },
    {
        "e_number": "E306A",
        "sin_number": "SIN306a",
        "ins_number": "INS306a",
        "name": "Tocophérols (mix)",
        "danger_level": 1,
        "description": "Antioxydants naturels (Vit E)",
        "source": "Naturel",
        "category": "Antioxydant"
    },
    {
        "e_number": "E310",
        "sin_number": "SIN310",
        "ins_number": "INS310",
        "name": "Gallate de propyle",
        "danger_level": 2,
        "description": "Antioxydant synthétique",
        "source": "Synthétique",
        "category": "Antioxydant"
    },
    {
        "e_number": "E311",
        "sin_number": "SIN311",
        "ins_number": "INS311",
        "name": "Gallate d’octyle",
        "danger_level": 2,
        "description": "Antioxydant",
        "source": "Synthétique",
        "category": "Antioxydant"
    },
    {
        "e_number": "E312",
        "sin_number": "SIN312",
        "ins_number": "INS312",
        "name": "Gallate dodecyle",
        "danger_level": 2,
        "description": "Antioxydant",
        "source": "Synthétique",
        "category": "Antioxydant"
    },
    {
        "e_number": "E313",
        "sin_number": "SIN313",
        "ins_number": "INS313",
        "name": "Trisodium citrate",
        "danger_level": 1,
        "description": "Antioxydant/agent acidifiant",
        "source": "Synthétique",
        "category": "Antioxydant"
    },
    {
        "e_number": "E315",
        "sin_number": "SIN315",
        "ins_number": "INS315",
        "name": "Isoascorbate de sodium",
        "danger_level": 1,
        "description": "Antioxydant",
        "source": "Synthétique",
        "category": "Antioxydant"
    },
    {
        "e_number": "E320",
        "sin_number": "SIN320",
        "ins_number": "INS320",
        "name": "BHA (Butylated hydroxyanisole)",
        "danger_level": 3,
        "description": "Antioxydant synthétique",
        "source": "Synthétique",
        "category": "Antioxydant"
    },
    {
        "e_number": "E321",
        "sin_number": "SIN321",
        "ins_number": "INS321",
        "name": "BHT (Butylated hydroxytoluene)",
        "danger_level": 3,
        "description": "Antioxydant synthétique",
        "source": "Synthétique",
        "category": "Antioxydant"
    },
    {
        "e_number": "E322",
        "sin_number": "SIN322",
        "ins_number": "INS322",
        "name": "Lécithine",
        "danger_level": 1,
        "description": "Émulsifiant naturel (soja, œuf)",
        "source": "Naturel",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E322A",
        "sin_number": "SIN322a",
        "ins_number": "INS322a",
        "name": "Lécithine (soja variante)",
        "danger_level": 1,
        "description": "Émulsifiant naturel",
        "source": "Naturel",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E325",
        "sin_number": "SIN325",
        "ins_number": "INS325",
        "name": "Lactate de sodium",
        "danger_level": 1,
        "description": "Régulateur d’acidité / conservateur",
        "source": "Synthétique",
        "category": "Régulateur d’acidité"
    },
    {
        "e_number": "E326",
        "sin_number": "SIN326",
        "ins_number": "INS326",
        "name": "Lactate de potassium",
        "danger_level": 1,
        "description": "Régulateur d’acidité",
        "source": "Synthétique",
        "category": "Régulateur d’acidité"
    },
    {
        "e_number": "E327",
        "sin_number": "SIN327",
        "ins_number": "INS327",
        "name": "Lactate de calcium",
        "danger_level": 1,
        "description": "Régulateur d’acidité",
        "source": "Synthétique",
        "category": "Régulateur d’acidité"
    },
    {
        "e_number": "E330",
        "sin_number": "SIN330",
        "ins_number": "INS330",
        "name": "Acide citrique",
        "danger_level": 1,
        "description": "Correcteur d’acidité, antioxydant naturel",
        "source": "Naturel",
        "category": "Acidifiant"
    },
    {
        "e_number": "E330A",
        "sin_number": "SIN330a",
        "ins_number": "INS330a",
        "name": "Acide citrique (variante)",
        "danger_level": 1,
        "description": "Acidifiant courant",
        "source": "Naturel",
        "category": "Acidifiant"
    },
    {
        "e_number": "E331",
        "sin_number": "SIN331",
        "ins_number": "INS331",
        "name": "Citrates de sodium",
        "danger_level": 1,
        "description": "Régulateur d’acidité",
        "source": "Synthétique",
        "category": "Régulateur d’acidité"
    },
    {
        "e_number": "E331A",
        "sin_number": "SIN331a",
        "ins_number": "INS331a",
        "name": "Citrate trisodique",
        "danger_level": 1,
        "description": "Régulateur d’acidité",
        "source": "Synthétique",
        "category": "Régulateur d’acidité"
    },
    {
        "e_number": "E332",
        "sin_number": "SIN332",
        "ins_number": "INS332",
        "name": "Citrate de calcium",
        "danger_level": 1,
        "description": "Régulateur d’acidité",
        "source": "Synthétique",
        "category": "Régulateur d’acidité"
    },
    {
        "e_number": "E334",
        "sin_number": "SIN334",
        "ins_number": "INS334",
        "name": "Tartarate de potassium",
        "danger_level": 1,
        "description": "Régulateur d’acidité",
        "source": "Naturel",
        "category": "Régulateur d’acidité"
    },
    {
        "e_number": "E335",
        "sin_number": "SIN335",
        "ins_number": "INS335",
        "name": "Citrate de sodium",
        "danger_level": 1,
        "description": "Régulateur d’acidité",
        "source": "Synthétique",
        "category": "Régulateur d’acidité"
    },
    {
        "e_number": "E338",
        "sin_number": "SIN338",
        "ins_number": "INS338",
        "name": "Acide phosphorique",
        "danger_level": 2,
        "description": "Acidifiant utilisé dans les sodas",
        "source": "Synthétique",
        "category": "Acidifiant"
    },
    {
        "e_number": "E338A",
        "sin_number": "SIN338a",
        "ins_number": "INS338a",
        "name": "Acide phosphorique (variante)",
        "danger_level": 2,
        "description": "Acidifiant",
        "source": "Synthétique",
        "category": "Acidifiant"
    },
    {
        "e_number": "E339",
        "sin_number": "SIN339",
        "ins_number": "INS339",
        "name": "Phosphates de sodium",
        "danger_level": 2,
        "description": "Régulateur d'acidité et séquestrant. Une consommation excessive de phosphates inorganiques est associée à des risques rénaux et cardiovasculaires.",
        "source": "Synthétique",
        "category": "Stabilisant"
    },
    {
        "e_number": "E340",
        "sin_number": "SIN340",
        "ins_number": "INS340",
        "name": "Phosphates de potassium",
        "danger_level": 2,
        "description": "Stabilisant et régulateur d'acidité. Vigilance requise sur l'accumulation de phosphates dans les aliments ultra-transformés.",
        "source": "Synthétique",
        "category": "Stabilisant"
    },
    {
        "e_number": "E341",
        "sin_number": "SIN341",
        "ins_number": "INS341",
        "name": "Phosphate de calcium",
        "danger_level": 1,
        "description": "Agent de texture/minéral",
        "source": "Synthétique",
        "category": "Sel minéral"
    },
    {
        "e_number": "E343",
        "sin_number": "SIN343",
        "ins_number": "INS343",
        "name": "Phosphate acide de sodium",
        "danger_level": 1,
        "description": "Additif minéral",
        "source": "Synthétique",
        "category": "Sel minéral"
    },
    {
        "e_number": "E350",
        "sin_number": "SIN350",
        "ins_number": "INS350",
        "name": "Carbonates de sodium (variante)",
        "danger_level": 1,
        "description": "Agent levant",
        "source": "Synthétique",
        "category": "Agent levant"
    },
    {
        "e_number": "E352",
        "sin_number": "SIN352",
        "ins_number": "INS352",
        "name": "Carbonate de potassium",
        "danger_level": 1,
        "description": "Agent levant",
        "source": "Synthétique",
        "category": "Agent levant"
    },
    {
        "e_number": "E400",
        "sin_number": "SIN400",
        "ins_number": "INS400",
        "name": "Acide alginique",
        "danger_level": 1,
        "description": "Épaississant extrait d’algues",
        "source": "Naturel",
        "category": "Épaississant"
    },
    {
        "e_number": "E401",
        "sin_number": "SIN401",
        "ins_number": "INS401",
        "name": "Alginate de sodium",
        "danger_level": 1,
        "description": "Épaississant / stabilisant",
        "source": "Naturel",
        "category": "Épaississant"
    },
    {
        "e_number": "E402",
        "sin_number": "SIN402",
        "ins_number": "INS402",
        "name": "Alginate de potassium",
        "danger_level": 1,
        "description": "Épaississant",
        "source": "Naturel",
        "category": "Épaississant"
    },
    {
        "e_number": "E404",
        "sin_number": "SIN404",
        "ins_number": "INS404",
        "name": "Alginate de calcium",
        "danger_level": 1,
        "description": "Épaississant",
        "source": "Naturel",
        "category": "Épaississant"
    },
    {
        "e_number": "E405",
        "sin_number": "SIN405",
        "ins_number": "INS405",
        "name": "Propylène glycol alginate",
        "danger_level": 2,
        "description": "Épaississant synthétique",
        "source": "Synthétique",
        "category": "Épaississant"
    },
    {
        "e_number": "E406",
        "sin_number": "SIN406",
        "ins_number": "INS406",
        "name": "Agar-agar",
        "danger_level": 1,
        "description": "Gélifiant naturel",
        "source": "Naturel",
        "category": "Gélifiant"
    },
    {
        "e_number": "E407",
        "sin_number": "SIN407",
        "ins_number": "INS407",
        "name": "Carraghénanes",
        "danger_level": 2,
        "description": "Épaississant extrait d’algues rouges",
        "source": "Naturel",
        "category": "Épaississant"
    },
    {
        "e_number": "E408",
        "sin_number": "SIN408",
        "ins_number": "INS408",
        "name": "Glucomannane",
        "danger_level": 1,
        "description": "Épaississant naturel",
        "source": "Naturel",
        "category": "Épaississant"
    },
    {
        "e_number": "E409",
        "sin_number": "SIN409",
        "ins_number": "INS409",
        "name": "Gomme tragacanthe",
        "danger_level": 1,
        "description": "Épaississant naturel",
        "source": "Naturel",
        "category": "Épaississant"
    },
    {
        "e_number": "E410",
        "sin_number": "SIN410",
        "ins_number": "INS410",
        "name": "Gomme de caroube",
        "danger_level": 1,
        "description": "Épaississant naturel",
        "source": "Naturel",
        "category": "Épaississant"
    },
    {
        "e_number": "E412",
        "sin_number": "SIN412",
        "ins_number": "INS412",
        "name": "Gomme guar",
        "danger_level": 1,
        "description": "Épaississant naturel",
        "source": "Naturel",
        "category": "Épaississant"
    },
    {
        "e_number": "E414",
        "sin_number": "SIN414",
        "ins_number": "INS414",
        "name": "Gomme arabique",
        "danger_level": 1,
        "description": "Épaississant naturel",
        "source": "Naturel",
        "category": "Épaississant"
    },
    {
        "e_number": "E415",
        "sin_number": "SIN415",
        "ins_number": "INS415",
        "name": "Gomme xanthane",
        "danger_level": 1,
        "description": "Épaississant et stabilisant",
        "source": "Naturel",
        "category": "Épaississant"
    },
    {
        "e_number": "E416",
        "sin_number": "SIN416",
        "ins_number": "INS416",
        "name": "Stéarate de mono- et diglycéryles",
        "danger_level": 1,
        "description": "Émulsifiant / stabilisant",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E420",
        "sin_number": "SIN420",
        "ins_number": "INS420",
        "name": "Sorbitol",
        "danger_level": 2,
        "description": "Édulcorant et humectant",
        "source": "Synthétique",
        "category": "Édulcorant"
    },
    {
        "e_number": "E422",
        "sin_number": "SIN422",
        "ins_number": "INS422",
        "name": "Glycérol",
        "danger_level": 1,
        "description": "Humectant, stabilisant",
        "source": "Naturel",
        "category": "Humectant"
    },
    {
        "e_number": "E422A",
        "sin_number": "SIN422a",
        "ins_number": "INS422a",
        "name": "Glycérol (variante)",
        "danger_level": 1,
        "description": "Humectant et solvant",
        "source": "Naturel",
        "category": "Humectant"
    },
    {
        "e_number": "E430",
        "sin_number": "SIN430",
        "ins_number": "INS430",
        "name": "Polysorbate 40",
        "danger_level": 2,
        "description": "Émulsifiant (Tween)",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E431",
        "sin_number": "SIN431",
        "ins_number": "INS431",
        "name": "Polysorbate 60",
        "danger_level": 2,
        "description": "Émulsifiant (Tween)",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E432",
        "sin_number": "SIN432",
        "ins_number": "INS432",
        "name": "Polysorbate 80",
        "danger_level": 2,
        "description": "Émulsifiant",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E433",
        "sin_number": "SIN433",
        "ins_number": "INS433",
        "name": "Polyoxyéthylène sorbitan",
        "danger_level": 2,
        "description": "Émulsifiant",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E440",
        "sin_number": "SIN440",
        "ins_number": "INS440",
        "name": "Pectines",
        "danger_level": 1,
        "description": "Gélifiant naturel",
        "source": "Naturel",
        "category": "Gélifiant"
    },
    {
        "e_number": "E440A",
        "sin_number": "SIN440a",
        "ins_number": "INS440a",
        "name": "Pectine (variante)",
        "danger_level": 1,
        "description": "Gélifiant naturel",
        "source": "Naturel",
        "category": "Gélifiant"
    },
    {
        "e_number": "E444",
        "sin_number": "SIN444",
        "ins_number": "INS444",
        "name": "Succinates",
        "danger_level": 1,
        "description": "Additif alimentaire diverse",
        "source": "Synthétique",
        "category": "Autre"
    },
    {
        "e_number": "E450",
        "sin_number": "SIN450",
        "ins_number": "INS450",
        "name": "Diphosphates",
        "danger_level": 2,
        "description": "Stabilisant et émulsifiant",
        "source": "Synthétique",
        "category": "Stabilisant"
    },
    {
        "e_number": "E450A",
        "sin_number": "SIN450a",
        "ins_number": "INS450a",
        "name": "Diphosphate disodique",
        "danger_level": 2,
        "description": "Phosphate utilisé comme agent levant",
        "source": "Synthétique",
        "category": "Stabilisant"
    },
    {
        "e_number": "E451",
        "sin_number": "SIN451",
        "ins_number": "INS451",
        "name": "Triphosphates",
        "danger_level": 2,
        "description": "Stabilisant et émulsifiant",
        "source": "Synthétique",
        "category": "Stabilisant"
    },
    {
        "e_number": "E452",
        "sin_number": "SIN452",
        "ins_number": "INS452",
        "name": "Polyphosphates",
        "danger_level": 2,
        "description": "Stabilisant, retient l’eau",
        "source": "Synthétique",
        "category": "Stabilisant"
    },
    {
        "e_number": "E452A",
        "sin_number": "SIN452a",
        "ins_number": "INS452a",
        "name": "Polyphosphate tetrasodique",
        "danger_level": 2,
        "description": "Phosphate",
        "source": "Synthétique",
        "category": "Stabilisant"
    },
    {
        "e_number": "E460",
        "sin_number": "SIN460",
        "ins_number": "INS460",
        "name": "Cellulose",
        "danger_level": 1,
        "description": "Agent de charge naturel",
        "source": "Naturel",
        "category": "Agent de charge"
    },
    {
        "e_number": "E460A",
        "sin_number": "SIN460a",
        "ins_number": "INS460a",
        "name": "Cellulose microcristalline",
        "danger_level": 1,
        "description": "Agent de charge",
        "source": "Naturel",
        "category": "Agent de charge"
    },
    {
        "e_number": "E461A",
        "sin_number": "SIN461a",
        "ins_number": "INS461a",
        "name": "Methylcellulose",
        "danger_level": 1,
        "description": "Épaississant synthétique",
        "source": "Synthétique",
        "category": "Épaississant"
    },
    {
        "e_number": "E462",
        "sin_number": "SIN462",
        "ins_number": "INS462",
        "name": "Ethylcellulose",
        "danger_level": 1,
        "description": "Agent filmogène",
        "source": "Synthétique",
        "category": "Agent de texture"
    },
    {
        "e_number": "E463",
        "sin_number": "SIN463",
        "ins_number": "INS463",
        "name": "Hydroxypropylcellulose",
        "danger_level": 1,
        "description": "Agent filmogène",
        "source": "Synthétique",
        "category": "Agent de texture"
    },
    {
        "e_number": "E470A",
        "sin_number": "SIN470a",
        "ins_number": "INS470a",
        "name": "Sels d’acides gras (calciques)",
        "danger_level": 1,
        "description": "Stabilisant / antiagglomérant",
        "source": "Synthétique",
        "category": "Stabilisant"
    },
    {
        "e_number": "E471",
        "sin_number": "SIN471",
        "ins_number": "INS471",
        "name": "Mono- et diglycérides d’acides gras",
        "danger_level": 2,
        "description": "Émulsifiant",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E471A",
        "sin_number": "SIN471a",
        "ins_number": "INS471a",
        "name": "Mono- et diglycérides (variante)",
        "danger_level": 2,
        "description": "Émulsifiant",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E472",
        "sin_number": "SIN472",
        "ins_number": "INS472",
        "name": "Esters d’acides gras",
        "danger_level": 2,
        "description": "Émulsifiant",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E472A",
        "sin_number": "SIN472a",
        "ins_number": "INS472a",
        "name": "Esters de mono- et diglycérides",
        "danger_level": 2,
        "description": "Émulsifiants divers",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E472e",
        "sin_number": "SIN472e",
        "ins_number": "INS472e",
        "name": "Esters d'acides gras et tartrique (DATEM)",
        "danger_level": 2,
        "description": "Émulsifiant très utilisé en panification et biscuiterie industrielle. Origine végétale ou animale.",
        "source": "Végétal / Animal",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E473",
        "sin_number": "SIN473",
        "ins_number": "INS473",
        "name": "Sucres esters d’acides gras",
        "danger_level": 2,
        "description": "Émulsifiant",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E474",
        "sin_number": "SIN474",
        "ins_number": "INS474",
        "name": "Stéaroyl-2-lactylates",
        "danger_level": 2,
        "description": "Émulsifiant",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E475",
        "sin_number": "SIN475",
        "ins_number": "INS475",
        "name": "Esters de polyglycérol",
        "danger_level": 2,
        "description": "Émulsifiant",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E476",
        "sin_number": "SIN476",
        "ins_number": "INS476",
        "name": "Polyglycérol polyricinoléate (PGPR)",
        "danger_level": 2,
        "description": "Émulsifiant, réduisant viscosité du chocolat",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E477",
        "sin_number": "SIN477",
        "ins_number": "INS477",
        "name": "Esters d’acides gras de sucres",
        "danger_level": 2,
        "description": "Émulsifiant",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E478",
        "sin_number": "SIN478",
        "ins_number": "INS478",
        "name": "Lécithine peptidée",
        "danger_level": 1,
        "description": "Émulsifiant dérivé",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E481",
        "sin_number": "SIN481",
        "ins_number": "INS481",
        "name": "Sodium stearoyl-2-lactylate",
        "danger_level": 2,
        "description": "Émulsifiant",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E482",
        "sin_number": "SIN482",
        "ins_number": "INS482",
        "name": "Calcium stearoyl-2-lactylate",
        "danger_level": 2,
        "description": "Émulsifiant",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E483",
        "sin_number": "SIN483",
        "ins_number": "INS483",
        "name": "Stearyl tartrate",
        "danger_level": 2,
        "description": "Émulsifiant",
        "source": "Synthétique",
        "category": "Émulsifiant"
    },
    {
        "e_number": "E491",
        "sin_number": "SIN491",
        "ins_number": "INS491",
        "name": "Stéaroyl Na",
        "danger_level": 2,
        "description": "Agent texture",
        "source": "Synthétique",
        "category": "Stabilisant"
    },
    {
        "e_number": "E493",
        "sin_number": "SIN493",
        "ins_number": "INS493",
        "name": "Stéaroyl K",
        "danger_level": 2,
        "description": "Agent texture",
        "source": "Synthétique",
        "category": "Stabilisant"
    },
    {
        "e_number": "E500",
        "sin_number": "SIN500",
        "ins_number": "INS500",
        "name": "Carbonates de sodium",
        "danger_level": 1,
        "description": "Correcteur d’acidité",
        "source": "Naturel",
        "category": "Régulateur d’acidité"
    },
    {
        "e_number": "E500A",
        "sin_number": "SIN500a",
        "ins_number": "INS500a",
        "name": "Carbonate de sodium (var.)",
        "danger_level": 1,
        "description": "Agent levant/minéral",
        "source": "Synthétique",
        "category": "Agent levant"
    },
    {
        "e_number": "E501",
        "sin_number": "SIN501",
        "ins_number": "INS501",
        "name": "Carbonate de potassium",
        "danger_level": 1,
        "description": "Agent minéral",
        "source": "Synthétique",
        "category": "Agent minéral"
    },
    {
        "e_number": "E503",
        "sin_number": "SIN503",
        "ins_number": "INS503",
        "name": "Carbonate d’ammonium",
        "danger_level": 1,
        "description": "Agent levant traditionnel",
        "source": "Synthétique",
        "category": "Agent levant"
    },
    {
        "e_number": "E504",
        "sin_number": "SIN504",
        "ins_number": "INS504",
        "name": "Carbonate de magnésium",
        "danger_level": 1,
        "description": "Agent minéral",
        "source": "Synthétique",
        "category": "Agent minéral"
    },
    {
        "e_number": "E507",
        "sin_number": "SIN507",
        "ins_number": "INS507",
        "name": "Acide chlorhydrique (usage min.)",
        "danger_level": 3,
        "description": "Additif acide (usage technique)",
        "source": "Synthétique",
        "category": "Acidifiant"
    },
    {
        "e_number": "E508",
        "sin_number": "SIN508",
        "ins_number": "INS508",
        "name": "Chlorure de potassium",
        "danger_level": 1,
        "description": "Sel minéral",
        "source": "Synthétique",
        "category": "Sel minéral"
    },
    {
        "e_number": "E509",
        "sin_number": "SIN509",
        "ins_number": "INS509",
        "name": "Chlorure de calcium",
        "danger_level": 1,
        "description": "Sel minéral",
        "source": "Synthétique",
        "category": "Sel minéral"
    },
    {
        "e_number": "E530",
        "sin_number": "SIN530",
        "ins_number": "INS530",
        "name": "Oxyde de magnésium",
        "danger_level": 1,
        "description": "Agent antiagglomérant / minéral",
        "source": "Synthétique",
        "category": "Agent antiagglomérant"
    },
    {
        "e_number": "E540",
        "sin_number": "SIN540",
        "ins_number": "INS540",
        "name": "Sulfate de magnésium",
        "danger_level": 1,
        "description": "Sel minéral",
        "source": "Synthétique",
        "category": "Sel minéral"
    },
    {
        "e_number": "E541",
        "sin_number": "SIN541",
        "ins_number": "INS541",
        "name": "Sulfate de sodium",
        "danger_level": 1,
        "description": "Sel minéral",
        "source": "Synthétique",
        "category": "Sel minéral"
    },
    {
        "e_number": "E542",
        "sin_number": "SIN542",
        "ins_number": "INS542",
        "name": "Peroxyde d’azote",
        "danger_level": 3,
        "description": "Agent technique (usage restreint)",
        "source": "Synthétique",
        "category": "Agent technique"
    },
    {
        "e_number": "E550",
        "sin_number": "SIN550",
        "ins_number": "INS550",
        "name": "Silicates",
        "danger_level": 1,
        "description": "Antiagglomérant",
        "source": "Synthétique",
        "category": "Agent antiagglomérant"
    },
    {
        "e_number": "E551",
        "sin_number": "SIN551",
        "ins_number": "INS551",
        "name": "Silice",
        "danger_level": 1,
        "description": "Antiagglomérant",
        "source": "Naturel",
        "category": "Agent antiagglomérant"
    },
    {
        "e_number": "E552",
        "sin_number": "SIN552",
        "ins_number": "INS552",
        "name": "Silicate de calcium",
        "danger_level": 1,
        "description": "Agent antiagglomérant/minéral",
        "source": "Synthétique",
        "category": "Agent antiagglomérant"
    },
    {
        "e_number": "E553",
        "sin_number": "SIN553",
        "ins_number": "INS553",
        "name": "Silicate de magnésium",
        "danger_level": 1,
        "description": "Agent antiagglomérant",
        "source": "Synthétique",
        "category": "Agent antiagglomérant"
    },
    {
        "e_number": "E554",
        "sin_number": "SIN554",
        "ins_number": "INS554",
        "name": "Silicate de sodium",
        "danger_level": 1,
        "description": "Agent antiagglomérant",
        "source": "Synthétique",
        "category": "Agent antiagglomérant"
    },
    {
        "e_number": "E570",
        "sin_number": "SIN570",
        "ins_number": "INS570",
        "name": "Acides gras",
        "danger_level": 1,
        "description": "Agents de texture/antioxydants",
        "source": "Naturel",
        "category": "Autre"
    },
    {
        "e_number": "E572",
        "sin_number": "SIN572",
        "ins_number": "INS572",
        "name": "Stéarate de calcium",
        "danger_level": 1,
        "description": "Agent de texture",
        "source": "Synthétique",
        "category": "Agent de texture"
    },
    {
        "e_number": "E576",
        "sin_number": "SIN576",
        "ins_number": "INS576",
        "name": "Stéarate de magnésium",
        "danger_level": 1,
        "description": "Agent de texture",
        "source": "Synthétique",
        "category": "Agent de texture"
    },
    {
        "e_number": "E578",
        "sin_number": "SIN578",
        "ins_number": "INS578",
        "name": "Glucono delta-lactone",
        "danger_level": 1,
        "description": "Acidifiant/désoxydant",
        "source": "Naturel",
        "category": "Acidifiant"
    },
    {
        "e_number": "E579",
        "sin_number": "SIN579",
        "ins_number": "INS579",
        "name": "Chélateur",
        "danger_level": 1,
        "description": "Agent chélateur",
        "source": "Synthétique",
        "category": "Autre"
    },
    {
        "e_number": "E620",
        "sin_number": "SIN620",
        "ins_number": "INS620",
        "name": "Acide glutamique",
        "danger_level": 1,
        "description": "Acide aminé (base pour exhausteurs)",
        "source": "Naturel",
        "category": "Exhausteur"
    },
    {
        "e_number": "E621",
        "sin_number": "SIN621",
        "ins_number": "INS621",
        "name": "Glutamate monosodique (MSG)",
        "danger_level": 3,
        "description": "Exhausteur de goût controversé",
        "source": "Synthétique",
        "category": "Exhausteur"
    },
    {
        "e_number": "E627",
        "sin_number": "SIN627",
        "ins_number": "INS627",
        "name": "Diguanylate disodique (GMP)",
        "danger_level": 2,
        "description": "Exhausteur d’umami",
        "source": "Synthétique",
        "category": "Exhausteur"
    },
    {
        "e_number": "E631",
        "sin_number": "SIN631",
        "ins_number": "INS631",
        "name": "Inosinate disodique (IMP)",
        "danger_level": 2,
        "description": "Exhausteur de goût",
        "source": "Synthétique",
        "category": "Exhausteur"
    },
    {
        "e_number": "E635",
        "sin_number": "SIN635",
        "ins_number": "INS635",
        "name": "Guanosine inosinate mix",
        "danger_level": 2,
        "description": "Exhausteur",
        "source": "Synthétique",
        "category": "Exhausteur"
    },
    {
        "e_number": "E639",
        "sin_number": "SIN639",
        "ins_number": "INS639",
        "name": "Calcium inosinate",
        "danger_level": 2,
        "description": "Exhausteur",
        "source": "Synthétique",
        "category": "Exhausteur"
    },
    {
        "e_number": "E650",
        "sin_number": "SIN650",
        "ins_number": "INS650",
        "name": "Zinc",
        "danger_level": 1,
        "description": "Additif minéral (enrichissement)",
        "source": "Synthétique",
        "category": "Additif minéral"
    },
    {
        "e_number": "E901",
        "sin_number": "SIN901",
        "ins_number": "INS901",
        "name": "Cire de cire d’abeille",
        "danger_level": 1,
        "description": "Agent d’enrobage naturel",
        "source": "Naturel",
        "category": "Agent d’enrobage"
    },
    {
        "e_number": "E902",
        "sin_number": "SIN902",
        "ins_number": "INS902",
        "name": "Carnauba wax",
        "danger_level": 1,
        "description": "Agent d’enrobage naturel",
        "source": "Naturel",
        "category": "Agent d’enrobage"
    },
    {
        "e_number": "E903",
        "sin_number": "SIN903",
        "ins_number": "INS903",
        "name": "Cire de candelilla",
        "danger_level": 1,
        "description": "Agent d’enrobage naturel",
        "source": "Naturel",
        "category": "Agent d’enrobage"
    },
    {
        "e_number": "E904",
        "sin_number": "SIN904",
        "ins_number": "INS904",
        "name": "Shellac",
        "danger_level": 1,
        "description": "Agent d’enrobage naturel",
        "source": "Naturel",
        "category": "Agent d’enrobage"
    },
    {
        "e_number": "E905",
        "sin_number": "SIN905",
        "ins_number": "INS905",
        "name": "Paraffine",
        "danger_level": 1,
        "description": "Agent d’enrobage",
        "source": "Synthétique",
        "category": "Agent d’enrobage"
    },
    {
        "e_number": "E906",
        "sin_number": "SIN906",
        "ins_number": "INS906",
        "name": "Glycéride de poisson",
        "danger_level": 1,
        "description": "Agent d’enrobage",
        "source": "Naturel",
        "category": "Agent d’enrobage"
    },
    {
        "e_number": "E908",
        "sin_number": "SIN908",
        "ins_number": "INS908",
        "name": "Microcristaux (divers)",
        "danger_level": 1,
        "description": "Utilisation technique",
        "source": "Synthétique",
        "category": "Autre"
    },
    {
        "e_number": "E920",
        "sin_number": "SIN920",
        "ins_number": "INS920",
        "name": "L-cysteine",
        "danger_level": 2,
        "description": "Améliorant de texture (dough conditioner)",
        "source": "Synthétique",
        "category": "Améliorant"
    },
    {
        "e_number": "E920A",
        "sin_number": "SIN920a",
        "ins_number": "INS920a",
        "name": "L-cystine (var.)",
        "danger_level": 2,
        "description": "Améliorant de texture",
        "source": "Synthétique",
        "category": "Améliorant"
    },
    {
        "e_number": "E950",
        "sin_number": "SIN950",
        "ins_number": "INS950",
        "name": "Acésulfame K",
        "danger_level": 2,
        "description": "Édulcorant artificiel",
        "source": "Synthétique",
        "category": "Édulcorant"
    },
    {
        "e_number": "E950A",
        "sin_number": "SIN950a",
        "ins_number": "INS950a",
        "name": "Acesulfame-K (var.)",
        "danger_level": 2,
        "description": "Édulcorant artificiel",
        "source": "Synthétique",
        "category": "Édulcorant"
    },
    {
        "e_number": "E951",
        "sin_number": "SIN951",
        "ins_number": "INS951",
        "name": "Aspartame",
        "danger_level": 3,
        "description": "Édulcorant artificiel controversé",
        "source": "Synthétique",
        "category": "Édulcorant"
    },
    {
        "e_number": "E952",
        "sin_number": "SIN952",
        "ins_number": "INS952",
        "name": "Acide cyclamique",
        "danger_level": 3,
        "description": "Édulcorant interdit dans certains pays",
        "source": "Synthétique",
        "category": "Édulcorant"
    },
    {
        "e_number": "E954",
        "sin_number": "SIN954",
        "ins_number": "INS954",
        "name": "Saccharine",
        "danger_level": 2,
        "description": "Édulcorant artificiel",
        "source": "Synthétique",
        "category": "Édulcorant"
    },
    {
        "e_number": "E955",
        "sin_number": "SIN955",
        "ins_number": "INS955",
        "name": "Sucralose",
        "danger_level": 2,
        "description": "Édulcorant artificiel",
        "source": "Synthétique",
        "category": "Édulcorant"
    },
    {
        "e_number": "E957",
        "sin_number": "SIN957",
        "ins_number": "INS957",
        "name": "Thaumatine",
        "danger_level": 1,
        "description": "Édulcorant protéique (dérivé naturel)",
        "source": "Naturel",
        "category": "Édulcorant"
    },
    {
        "e_number": "E959",
        "sin_number": "SIN959",
        "ins_number": "INS959",
        "name": "Neohesperidine DC",
        "danger_level": 1,
        "description": "Édulcorant obtenu à partir d’agrumes",
        "source": "Naturel",
        "category": "Édulcorant"
    },
    {
        "e_number": "E960",
        "sin_number": "SIN960",
        "ins_number": "INS960",
        "name": "Stéviol glycosides (stevia)",
        "danger_level": 1,
        "description": "Édulcorant naturel",
        "source": "Naturel",
        "category": "Édulcorant"
    },
    {
        "e_number": "E961",
        "sin_number": "SIN961",
        "ins_number": "INS961",
        "name": "Neotame",
        "danger_level": 2,
        "description": "Édulcorant intense",
        "source": "Synthétique",
        "category": "Édulcorant"
    },
    {
        "e_number": "E962",
        "sin_number": "SIN962",
        "ins_number": "INS962",
        "name": "Aspartame-acesulfame salt",
        "danger_level": 2,
        "description": "Édulcorant mixte",
        "source": "Synthétique",
        "category": "Édulcorant"
    },
    {
        "e_number": "E965",
        "sin_number": "SIN965",
        "ins_number": "INS965",
        "name": "Maltitol",
        "danger_level": 1,
        "description": "Édulcorant / polyol",
        "source": "Synthétique",
        "category": "Édulcorant"
    },
    {
        "e_number": "E966",
        "sin_number": "SIN966",
        "ins_number": "INS966",
        "name": "Lactitol",
        "danger_level": 1,
        "description": "Édulcorant / polyol",
        "source": "Synthétique",
        "category": "Édulcorant"
    },
    {
        "e_number": "E967",
        "sin_number": "SIN967",
        "ins_number": "INS967",
        "name": "Xylitol",
        "danger_level": 1,
        "description": "Édulcorant polyol",
        "source": "Naturel",
        "category": "Édulcorant"
    },
    {
        "e_number": "E968",
        "sin_number": "SIN968",
        "ins_number": "INS968",
        "name": "Erythritol",
        "danger_level": 1,
        "description": "Édulcorant polyol",
        "source": "Naturel",
        "category": "Édulcorant"
    },
    {
        "e_number": "E969",
        "sin_number": "SIN969",
        "ins_number": "INS969",
        "name": "Monk fruit extract (var.)",
        "danger_level": 1,
        "description": "Édulcorant naturel (variante)",
        "source": "Naturel",
        "category": "Édulcorant"
    },
    {
        "e_number": "E999",
        "sin_number": "SIN999",
        "ins_number": "INS999",
        "name": "Misc additives",
        "danger_level": 1,
        "description": "Divers additifs techniques",
        "source": "Synthétique",
        "category": "Autre"
    },
    {
        "e_number": "E1422",
        "sin_number": "SIN1422",
        "ins_number": "INS1422",
        "name": "Adipate de diamidon acétylé",
        "danger_level": 1,
        "description": "Amidon modifié épaississant résistant aux températures élevées et aux sauces acides.",
        "source": "Végétal modifié",
        "category": "Épaississant"
    },
    {
        "e_number": "E1442",
        "sin_number": "SIN1442",
        "ins_number": "INS1442",
        "name": "Phosphate de diamidon hydroxypropylé",
        "danger_level": 1,
        "description": "Amidon modifié texturant très utilisé dans les desserts lactés et plats cuisinés.",
        "source": "Végétal modifié",
        "category": "Épaississant"
    }
]
