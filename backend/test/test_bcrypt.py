from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def test_hash(pw: str):
    h = pwd_context.hash(pw)
    print("HASH:", h)
    ok = pwd_context.verify(pw, h)
    print("verify:", ok)

if __name__ == "__main__":
    test_hash("2232003")
