import httpx
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt

from api.config import settings

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Validates the Clerk JWT token found in the Authorization header.
    Returns the decoded token payload (dict) containing user info.
    """
    token = credentials.credentials
    
    if not settings.CLERK_ISSUER:
        print("WARNING: CLERK_ISSUER not set in environment. Skipping verification.")
    
    try:
        # 1. Fetch Clerk's JWKS (Public Keys)
        jwks_url = f"{settings.CLERK_ISSUER}/.well-known/jwks.json" if settings.CLERK_ISSUER else None
        
        if jwks_url:
            async with httpx.AsyncClient() as client:
                response = await client.get(jwks_url)
                if response.status_code != 200:
                    print(f"Auth Error: Failed to fetch JWKS from {jwks_url}. Status: {response.status_code}")
                    raise Exception("JWKS Fetch Failed")
                jwks = response.json()

            # 2. Match the Key ID (kid)
            unverified_header = jwt.get_unverified_header(token)
            token_kid = unverified_header.get("kid")

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
                print(f"Auth Error: Token KID {token_kid} not found in Clerk JWKS.")
                raise HTTPException(status_code=401, detail="Invalid token signature key")

            # 3. Decode & Verify
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                audience=None,
                issuer=settings.CLERK_ISSUER
            )
        else:
            # Fallback for local testing (NOT SECURE in production)
            payload = jwt.get_unverified_claims(token)

        return payload
            
    except Exception as e:
        print(f"--- AUTH ERROR DEBUG ---")
        print(f"Error: {str(e)}")
        print(f"Configured Issuer: {settings.CLERK_ISSUER}")
        print(f"------------------------")
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def is_organizer(user_payload: dict) -> bool:
    """
    Helper to check if the user has the 'organizer' role.
    Requires Clerk Session Token to include 'unsafe_metadata'.
    """
    metadata = user_payload.get("unsafe_metadata", {})
    
    # POLISHED: Add debug log if metadata is missing (Common Config Error)
    if not metadata:
        print(f"DEBUG: 'unsafe_metadata' is missing for user {user_payload.get('sub')}. "
              "Check if Clerk JWT Template is named 'default' and includes {{user.unsafe_metadata}}.")
        
    return metadata.get("role") == "organizer"