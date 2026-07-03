"""Référentiel d'ingrédients cosmétiques à risque (base du scoring, façon Yuka).

Liste volontairement concise mais couvrant les familles les plus signalées
(perturbateurs endocriniens, allergènes forts, irritants). Les noms sont en
minuscules pour un matching insensible à la casse sur la liste INCI.

danger_level : 1 = faible, 2 = modéré, 3 = élevé.

Étendre cette liste (ou la remplir depuis une source externe) améliore
directement la finesse du score, sans changer le code.
"""

# (name_inci, danger_level, concern, description)
COSMETIC_INGREDIENTS = [
    ("methylparaben", 2, "perturbateur endocrinien", "Conservateur de la famille des parabènes."),
    ("ethylparaben", 2, "perturbateur endocrinien", "Conservateur (parabène)."),
    ("propylparaben", 3, "perturbateur endocrinien", "Parabène à chaîne longue, plus préoccupant."),
    ("butylparaben", 3, "perturbateur endocrinien", "Parabène à chaîne longue, plus préoccupant."),
    ("isobutylparaben", 3, "perturbateur endocrinien", "Parabène à chaîne ramifiée."),
    ("phenoxyethanol", 2, "irritant", "Conservateur, irritant possible et restreint chez le nourrisson."),
    ("dmdm hydantoin", 3, "libérateur de formaldéhyde", "Conservateur libérant du formaldéhyde."),
    ("imidazolidinyl urea", 3, "libérateur de formaldéhyde", "Conservateur libérant du formaldéhyde."),
    ("diazolidinyl urea", 3, "libérateur de formaldéhyde", "Conservateur libérant du formaldéhyde."),
    ("quaternium-15", 3, "libérateur de formaldéhyde", "Conservateur libérant du formaldéhyde."),
    ("methylisothiazolinone", 3, "allergène", "Conservateur, allergène de contact puissant."),
    ("methylchloroisothiazolinone", 3, "allergène", "Conservateur, allergène de contact puissant."),
    ("triclosan", 3, "perturbateur endocrinien", "Antibactérien controversé."),
    ("butylated hydroxyanisole", 3, "cancérogène suspecté", "Antioxydant (BHA)."),
    ("butylated hydroxytoluene", 2, "perturbateur endocrinien", "Antioxydant (BHT)."),
    ("sodium lauryl sulfate", 2, "irritant", "Tensioactif sulfaté irritant."),
    ("sodium laureth sulfate", 1, "irritant", "Tensioactif sulfaté, plus doux mais possible trace de dioxane."),
    ("cyclopentasiloxane", 2, "préoccupation environnementale", "Silicone volatil (D5)."),
    ("cyclotetrasiloxane", 3, "perturbateur endocrinien", "Silicone volatil (D4)."),
    ("oxybenzone", 3, "perturbateur endocrinien", "Filtre UV (benzophénone-3)."),
    ("benzophenone-3", 3, "perturbateur endocrinien", "Filtre UV."),
    ("ethylhexyl methoxycinnamate", 2, "perturbateur endocrinien", "Filtre UV (octinoxate)."),
    ("aluminum chlorohydrate", 2, "controversé", "Sel d'aluminium des anti-transpirants."),
    ("retinyl palmitate", 2, "photosensibilisant", "Dérivé de vitamine A."),
    ("toluene", 3, "neurotoxique", "Solvant (vernis)."),
    ("talc", 2, "controversé", "Risque de contamination selon l'origine."),
    ("parfum", 1, "allergène", "Peut contenir des allergènes non détaillés."),
    ("fragrance", 1, "allergène", "Peut contenir des allergènes non détaillés."),
]
