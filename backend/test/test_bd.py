import asyncio

# Ancien script manuel conservé comme référence ; les tests API maintenus sont
# dans backend/tests/api. Les imports restent locaux pour que pytest puisse
# collecter l'ensemble du dépôt sans dépendre d'un module supprimé.
__test__ = False

async def main():
    raise RuntimeError(
        "Ce script utilise une ancienne couche d'accès aux utilisateurs. "
        "Lancez plutôt: pytest tests/api/test_auth.py"
    )

if __name__ == "__main__":
    asyncio.run(main())
