from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def test_hash_roundtrip():
    pw = "mot-de-passe-de-test"
    h = pwd_context.hash(pw)
    assert h != pw
    assert pwd_context.verify(pw, h)

if __name__ == "__main__":
    test_hash_roundtrip()
