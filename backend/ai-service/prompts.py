"""
FitFirst AI Inventory Service — Label Prompts for Zero-Shot Classification (CLIP)
Maps database enums to natural-language descriptions for visual clothing classification.
"""

CATEGORY_PROMPTS = {
    "KURTA": "a kurta or kurti, traditional tunic garment",
    "SAREE": "a saree or sari, draped Indian fabric",
    "SALWAR_KAMEEZ": "a salwar kameez or churidar suit set",
    "LEHENGA": "a lehenga skirt with matching blouse and dupatta",
    "SHERWANI": "a formal men's sherwani coat or achkan",
    "DHOTI": "a dhoti or veshti traditional lower garment",
    "DUPATTA": "a dupatta scarf, stole, or veil",
    "SHIRT": "a button-down formal or casual shirt",
    "TROUSERS": "tailored dress trousers or formal slacks",
    "JEANS": "denim jeans or denim pants",
    "DRESS": "a western dress, frock, or gown",
    "SKIRT": "a western skirt or flared lower garment",
    "JACKET": "a jacket, coat, blazer, or Nehru jacket",
    "KIDS_KURTA": "a junior child's ethnic kurta",
    "KIDS_SHIRT": "a young child's shirt",
    "KIDS_TROUSERS": "children's trousers or pants",
    "KIDS_DRESS": "a young girl's party dress or frock",
    "ACCESSORIES": "a fashion accessory, belt, bag, or footwear",
}

COLOR_PROMPTS = {
    "WHITE": "white or off-white solid color clothing",
    "CREAM_IVORY": "cream, ivory, ecru, or light champagne colored garment",
    "LIGHT_PASTELS": "light pastel shades like blush pink, mint green, powder blue, lavender",
    "WARM_EARTH": "warm earth tones — beige, camel, tan, rust, terracotta, brown",
    "BRIGHT_WARM": "vibrant warm colors — bright red, orange, coral, gold, sunny yellow",
    "BRIGHT_COOL": "vibrant cool colors — royal blue, violet, magenta, emerald green",
    "DARK_NEUTRAL": "dark neutral colors — navy blue, charcoal gray, jet black, dark olive",
    "JEWEL_TONES": "deep rich jewel tones — teal, maroon, burgundy, deep ruby, wine, mustard",
    "MULTICOLOR": "multicolored pattern with many contrasting colors",
}

PATTERN_PROMPTS = {
    "SOLID": "plain solid color fabric with no pattern or print",
    "STRIPES": "striped fabric pattern with parallel lines",
    "CHECKS": "checkered, plaid, or windowpane grid pattern",
    "FLORAL": "floral print or botanical flower pattern",
    "GEOMETRIC": "geometric shapes, diamond, or abstract repeating pattern",
    "PAISLEY": "traditional paisley or motif teardrop pattern",
    "EMBROIDERED": "embroidered fabric with zari, thread work, or sequin embellishment",
    "BLOCK_PRINT": "hand block printed motif pattern on fabric",
    "ABSTRACT": "abstract artistic print or watercolor pattern",
    "ANIMAL_PRINT": "animal print such as leopard, zebra, or python texture",
}

FIT_PROMPTS = {
    "SLIM": "slim fit, form-fitting, narrow silhouette",
    "REGULAR": "regular classic fit, standard proportion cut",
    "RELAXED_LOOSE": "relaxed, loose, boxy, or oversized fit",
    "FLARED_ANARKALI": "flared anarkali silhouette with wide umbrella hemline",
    "STRAIGHT_CUT": "straight cut garment falling straight down from shoulder or waist",
    "A_LINE": "A-line cut, narrower at top and gradually widening at hem",
    "WRAPAROUND": "wraparound style that wraps around body or ties at waist",
    "TAILORED_STRUCTURED": "structured tailored cut with crisp padded shoulders or seams",
}

GENDER_PROMPTS = {
    "WOMEN": "women's clothing or womenswear garment",
    "MEN": "men's clothing or menswear garment",
    "KIDS": "children's or kid's clothing",
    "UNISEX": "unisex garment suitable for both men and women",
}
