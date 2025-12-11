from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
import httpx
from config import settings

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Validates the Clerk JWT token found in the Authorization header.
    Returns the decoded token payload (dict) containing user info.
    """
    token = credentials.credentials
    
    # FIX: SECURITY - Enforce CLERK_ISSUER to prevent forging tokens in dev or prod
    if not settings.CLERK_ISSUER:
        raise HTTPException(status_code=500, detail="Server misconfiguration: CLERK_ISSUER is missing.")

    # 2. Verify signature against Clerk's public keys
    try:
        # Fetch Clerk's JSON Web Key Set (JWKS)
        # Optimization Tip: In high-scale apps, cache this response to avoid HTTP calls on every request.
        jwks_url = f"{settings.CLERK_ISSUER}/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url)
            jwks = response.json()

        # Get the Key ID (kid) from the incoming token header
        unverified_header = jwt.get_unverified_header(token)
        token_kid = unverified_header.get("kid")

        # Find the matching public key
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == token_kid:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Unable to find appropriate key")

        # Decode and verify
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=None, # Clerk often doesn't enforce audience for frontend tokens
            issuer=settings.CLERK_ISSUER
        )
        return payload
            
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")
