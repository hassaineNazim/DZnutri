from routers.products import _is_barcode_name, resolve_off_categories, resolve_off_product_name


def test_resolve_off_product_name_prefers_french_name():
    assert resolve_off_product_name(
        {
            "product_name": "Orange drink",
            "product_name_fr": "Boisson à l'orange",
        },
        "6130000000000",
    ) == "Boisson à l'orange"


def test_resolve_off_product_name_uses_other_localized_name():
    assert resolve_off_product_name(
        {"product_name": None, "product_name_es": "Galletas integrales"},
        "6130000000001",
    ) == "Galletas integrales"


def test_resolve_off_product_name_never_returns_a_barcode():
    assert resolve_off_product_name(
        {"product_name": "6130000000002", "brands": "Remo"},
        "6130000000002",
    ) == "Produit Remo"


def test_resolve_off_product_name_has_safe_generic_fallback():
    assert resolve_off_product_name({}, "6130000000003") == "Produit sans nom"
    assert _is_barcode_name("Produit sans nom", "6130000000003")


def test_resolve_off_categories_accepts_explicit_null_values():
    assert resolve_off_categories(
        {
            "pnns_groups_1": None,
            "pnns_groups_2": None,
            "categories": None,
        }
    ) == (None, None)


def test_resolve_off_categories_prefers_pnns_then_falls_back_to_tags():
    assert resolve_off_categories(
        {
            "pnns_groups_1": "Beverages",
            "pnns_groups_2": None,
            "categories": "Drinks, Orange drinks",
        }
    ) == ("Beverages", "Orange drinks")
