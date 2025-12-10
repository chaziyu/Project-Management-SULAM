from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
import httpx
from config import settings

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Validates the Clerk JWT token.
    """
    token = credentials.credentials
    
    # DEV MODE: If no issuer is set, decode without verifying signature
    if not settings.CLERK_ISSUER:
        try:
            return jwt.get_unverified_claims(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token structure")

    # PROD MODE: Verify signature against Clerk's public keys
    try:
        jwks_url = f"{settings.CLERK_ISSUER}/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url)
            jwks = response.json()

        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if rsa_key:
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                audience=None,
                issuer=settings.CLERK_ISSUER
            )
            return payload
            
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")
        
    raise HTTPException(status_code=401, detail="Unable to find appropriate key")